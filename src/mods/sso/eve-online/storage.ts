import type { State } from '.'
import { hooks } from 'cortex/storage'

hooks.register('up', async db => {
  await db.collection<State>('states').createIndex({ createdOn: 1}, {
    expireAfterSeconds: 300,
  })
})
