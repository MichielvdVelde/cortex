import type { Token } from '../sso/eve-online'
import { registerPolicy, registerPolicyGroup } from 'cortex/mods/auth/register'
import { getDb } from 'cortex/storage/mongodb'
import { deduplicate } from 'cortex/utility/utility'

registerPolicy({
  _id: 'char-corp-full',
  name: 'Corporation (Full)',
  description: 'Full access to the character\'s corporation.',
  effect: 'allow',
  resource: ['corporation:${identity.corporationId}:*'],
  action: ['*'],
})

registerPolicy({
  _id: 'system-corp-full',
  name: 'System Corporation (Full)',
  description: 'Full access to the system corporation.',
  effect: 'allow',
  resource: [`corporation:${process.env.CORPORATION_ID}:*`],
  action: ['*'],
})

registerPolicyGroup('character', context => context.identity!.characterId)
registerPolicyGroup('alliance', context => context.identity!.allianceId)
registerPolicyGroup('corporation', context => context.identity!.corporationId)
registerPolicyGroup('role', context => context.identity!.roles ? { $in: context.identity!.roles } : undefined)
registerPolicyGroup('title', context => context.identity!.titles ? { $in: context.identity!.titles } : undefined)
registerPolicyGroup('scope', async context => {
  const db = await getDb()
  const collection = db.collection<Token>('tokens')
  const scopes = deduplicate((await collection.find({
    characterId: context.identity!.characterId
  }, { projection: { scopes: 1 } }).toArray()).flatMap(t => t.scopes))
  return scopes.length ? { $in: scopes } : undefined
})
