import { registerPolicy } from './register'

registerPolicy({
  _id: 'full',
  name: 'Full Access',
  description: 'Full access to all resources. Use with care!',
  effect: 'allow',
  resource: ['*'],
  action: ['*'],
})

registerPolicy({
  _id: 'admin-full',
  name: 'Admin (Full)',
  description: 'Full access to the admin resources. Use with care!',
  effect: 'allow',
  resource: ['admin:*'],
  action: ['*'],
})

registerPolicy({
  _id: 'admin-read',
  name: 'Admin (Read)',
  description: 'Read access to the admin resources.',
  effect: 'allow',
  resource: ['admin:*'],
  action: ['read'],
})
