import { registerPolicy } from 'cortex/mods/auth/register'

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
