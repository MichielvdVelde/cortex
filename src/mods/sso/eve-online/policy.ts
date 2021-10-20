import type { Token } from '.'
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

registerPolicyGroup('character', context => context.identity?.characterId)
registerPolicyGroup('alliance', context => context.identity?.allianceId)
registerPolicyGroup('corporation', context => context.identity?.corporationId)
registerPolicyGroup('role', context => context.identity?.roles)
registerPolicyGroup('title', context => context.identity?.titles)
registerPolicyGroup('scope', async context => {
  if (!context.identity) {
    return
  }

  const db = await getDb()
  const collection = db.collection<Token>('tokens')
  const scopes = deduplicate((await collection.find({
    characterId: context.identity.characterId
  }, { projection: { scopes: 1 } }).toArray()).flatMap(t => t.scopes))
  return scopes.length ? scopes : undefined
})
