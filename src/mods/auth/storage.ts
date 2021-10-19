import type { Policy } from '.'
import { hooks } from 'cortex/storage'
import { getPolicies } from './register'

hooks.register('up', async (_, client) => {
  const db = client.db('policies')
  const collection = db.collection<Policy>('policies')

  if (await collection.countDocuments({}, { limit: 1 })) {
    return
  }

  await collection.insertMany([...getPolicies()])
})
