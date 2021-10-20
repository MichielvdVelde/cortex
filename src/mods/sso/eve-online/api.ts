import type { State } from '.'
import type { Scope } from 'cortex/mods/eve-online/types'
import type { Account, User } from 'cortex/mods/auth'
import { nanoid } from 'nanoid/async'
import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { getDb } from 'cortex/storage/mongodb'
import { getScopesFor } from '../../eve-online/scopes'
import { exchangeCode, generateRedirectUrl } from './sso'
import { getCharacter } from 'cortex/mods/eve-online/functions'

hooks.register('route', {
  path: '/sso/eve-online/redirect',
  execute: async context => {
    const search = new URLSearchParams(context.querystring)
    const link = search.has('link') && !!context.identity
    const scopes = getScopesFor(...(search.get('module')?.split(',') ?? []))

    if (scopes.length && !context.identity) {
      // User is trying to get scopes before they are even logged in
      throw new HttpErrors.Forbidden('I\'m sorry Dave, I\'m afraid I can\'t do that.')
    } else if (scopes.length && link) {
      // User is trying to link a new character with the given scopes
      throw new HttpErrors.Forbidden('I\'m sorry Dave, I\'m afraid I can\'t do that.')
    }

    const db = await getDb()
    const collection = db.collection<State>('states')
    const { insertedId } = await collection.insertOne({
      _id: await nanoid(),
      link,
      ref: search.has('ref') ? search.get('ref')! : undefined,
      accountId: context.identity?.accountId,
      characterId: context.identity?.characterId,
      createdOn: new Date(),
    })

    return {
      uri: generateRedirectUrl(insertedId, scopes)
    }
  }
})

hooks.register('route', {
  path: '/sso/eve-online/callback',
  execute: async context => {
    const search = new URLSearchParams(context.querystring)
    const code = search.get('code')
    const stateId = search.get('state')

    if (!code || stateId?.length !== 21) {
      throw new HttpErrors.BadRequest('Missing or invalid parameters')
    }

    const db = await getDb()
    const collection = db.collection<State>('states')
    const state = await collection.findOne({ _id: stateId })

    if (!state) {
      throw new HttpErrors.Forbidden('Missing state')
    }

    await collection.deleteOne({ _id: stateId })

    // Get and process access token
    const {
      access_token,
      refresh_token,
      expires_in,
      decoded_access_token,
    } = await exchangeCode(code)

    const {
      sub,
      scp,
      owner,
    } = decoded_access_token

    const characterId = parseInt(sub.split(':').pop()!)
    const scopes = scp ? Array.isArray(scp) ? scp as Scope[] : [scp] as Scope[] : []

    const userCollection = db.collection<User>('users')
    const accountCollection = db.collection<Account>('accounts')

    let user = await userCollection.findOne({ _id: characterId })

    if (user?.isBanned) {
      throw new HttpErrors.Forbidden(
        'You are unauthorized. You will experience a tingling sensation and then death.'
      )
    }

    if (scopes.length && state.characterId !== characterId) {
      // User requested scopes but logged in with another character
      throw new HttpErrors.Unauthorized('I\'m sorry Dave, I\'m afraid I can\'t do that.')
    }

    if (state.link) {
      if (!user) {
        // create new user and link to existing account
        user = {
          _id: characterId,
          accountId: state.accountId!,
          owner,
          isBanned: false,
        }

        await userCollection.insertOne(user)
      } else if (user.accountId !== state.accountId) {
        // switch user between accounts
        const previousId = user.accountId
        await userCollection.updateOne({ _id: characterId }, {
          $set: { accountId: state.accountId }
        })
        user.accountId = state.accountId!

        // delete old account if empty
        if (!await userCollection.countDocuments({ accountId: previousId }, { limit: 1 })) {
          await accountCollection.deleteOne({ _id: previousId })
        }
      }
    }

    if (!user) {
      // create new account and user
      const { insertedId } = await accountCollection.insertOne({
        _id: await nanoid(),
        createdOn: new Date(),
        createdBy: characterId,
      })

      user = {
        _id: characterId,
        accountId: insertedId,
        owner,
        isBanned: false,
      }

      await userCollection.insertOne(user)
    }

    const character = await getCharacter(characterId)

    if (scopes.length) {
      const tokenCollection = db.collection('tokens')
      tokenCollection.updateOne({
        characterId,
        scopes: {
          $all: [
            { '$elemMatch': { $eq: scopes } }
          ]
        }
      }, {
        $set: {
          allianceId: character.alliance_id,
          corporationId: character.corporation_id,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresOn: new Date(Date.now() + (expires_in * 1000)),
          scopes,
        },
        $setOnInsert: {
          _id: await nanoid(),
          characterId,
        }
      }, { upsert: true })
    }

    // Log in the user
    context.session!.accountId = user.accountId
    context.session!.characterId = characterId

    // Redirect the user agent
    context.redirect(state.ref ?? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${process.env.HOST_NAME}`)
  }
})
