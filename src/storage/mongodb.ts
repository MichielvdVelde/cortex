import { MongoClient } from 'mongodb'
import { hooks } from './symbols'
import { Deferred } from 'cortex/utility/async'

export { hooks } from './symbols'

const client = new MongoClient(process.env.MONGODB_URL!)

let deferred: Deferred<MongoClient> | undefined
let connected = false

export async function getClient() {
  if (!connected) {
    if (!deferred) {
      deferred = new Deferred<MongoClient>()
      await client.connect()
      connected = true
      const { importMods } = await import('cortex/config/mods')
      await importMods('storage')
      for (const hook of hooks.map('up')) {
        await hook(await getDb(), client)
      }
      deferred.resolve(client)
      deferred = undefined
      return client
    } else {
      return deferred.promise
    }
  } else {
    return client
  }
}

export async function getDb(dbName?: string) {
  return (await getClient()).db(dbName)
}

export async function closeClient() {
  if (connected) {
    await client.close()
  }
}
