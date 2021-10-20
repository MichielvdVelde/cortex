import type { User, Policy, ToPolicy } from '.'
import { IdentityBasedPolicy } from 'iam-policies'
import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { getDb } from 'cortex/storage/mongodb'
import { deduplicate } from 'cortex/utility/utility'
import { getScopesFor } from 'cortex/mods/eve-online/scopes'
import { findToken } from 'cortex/mods/eve-online/functions'
import { protect } from './middleware'
import { createGroupFilter } from './register'

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

    context.identity = {
      accountId: user.accountId,
      allianceId: character.alliance_id,
      characterId: character._id,
      corporationId: character.corporation_id,
      roles: character.roles,
      titles: character.titles,
    }

    const policyDb = await getDb('policies')
    const toPolicyCollection = policyDb.collection<ToPolicy>('to-policies')
    const paths = deduplicate((await toPolicyCollection.find(await createGroupFilter(context as any), {
      projection: { policies: 1 }
    }).toArray()).flatMap(p => p.policies))

    const policyCollection = policyDb.collection<Policy>('policies')
    const policies = await policyCollection.find({ _id: { $in: paths }}).toArray()

    context.identity.policy = new IdentityBasedPolicy({
      // @ts-expect-error
      statements: policies,
    })

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
