import type { User, Policy, ToPolicy } from '.'
import { IdentityBasedPolicy } from 'iam-policies'
import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { getDb } from 'cortex/storage/mongodb'
import { deduplicate } from 'cortex/utility/utility'
import { getScopesFor } from 'cortex/mods/sso/eve-online/scopes'
import { findToken } from '../sso/eve-online/functions'
import { protect } from './middleware'

hooks.register('middleware', app => {
  app.use(async (context, next) => {
    if (!context.session?.populated) {
      return next()
    }

    if (!context.session.accountId || !context.session.characterId) {
      context.session = null
      return next()
    }

    const db = await getDb()
    const userCollection = db.collection<User>('users')
    const user = await userCollection.findOne({
      _id: context.session.characterId,
      accountId: context.session.accountId,
    })

    if (!user) {
      context.session = null
      return next()
    }

    const eveDb = await getDb('eve-online')
    const characterCollection = eveDb.collection('characters')
    const character = await characterCollection.findOne({ _id: user._id })

    if (!character) {
      context.session = null
      return next()
    }

    const tokenCollection = db.collection('tokens')
    const scopes = deduplicate((await tokenCollection.find({
      characterId: character._id,
    }, { projection: { scopes: 1 } }).toArray()).flatMap(token => token.scopes))

    const policyDb = await getDb('policies')
    const toPolicyCollection = policyDb.collection<ToPolicy>('to-policies')
    const paths = deduplicate((await toPolicyCollection.find({
      $or: [
        { type: 'account', target: user.accountId },
        { type: 'character', target: character._id },
        { type: 'corporation', target: character.corporation_id },
        { type: 'alliance', target: character.alliance_id ?? 0 },
        { type: 'role', target: { $in: character.roles ?? [] } },
        { type: 'title', target: { $in: character.titles ?? [] } },
        { type: 'scope', target: { $in: scopes } },
      ],
    }, { projection: { policies: 1 } }).toArray()).flatMap(p => p.policies))

    const policyCollection = policyDb.collection<Policy>('policies')
    const policies = await policyCollection.find({ _id: { $in: paths }}).toArray()

    context.identity = {
      accountId: user.accountId,
      allianceId: character.alliance_id,
      characterId: character._id,
      corporationId: character.corporation_id,
      roles: character.roles,
      titles: character.titles,
      policy: new IdentityBasedPolicy({
        // @ts-expect-error
        statements: policies,
      })
    }

    return next()
  })
})

// Load the client identity
hooks.register('route', {
  path: '/auth/identity',
  execute: async context => {
    return context.identity ?? { guest: true }
  }
})

// Log out the client identity
hooks.register('route', {
  path: '/auth/identity',
  method: 'delete',
  middleware: [protect()],
  execute: async context => {
    context.session = null
    context.response.status = 204
  }
})

// Check if the character has the right scopes for the module(s)
hooks.register('route', {
  path: '/auth/check',
  middleware: [protect()],
  execute: async context => {
    const search = new URLSearchParams(context.querystring)
    if (!search.has('modules')) {
      throw new HttpErrors.BadRequest('Missing query parameter')
    }
    const scopes = getScopesFor(...search.get('modules')!.split(','))

    if (!scopes.length) {
      return false
    }

    const token = await findToken({
      characterId: context.identity!.characterId,
      scopes: { $all: scopes },
    }, { refresh: false })

    return token ? true : false
  }
})
