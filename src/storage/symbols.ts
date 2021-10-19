import type { Db, MongoClient } from 'mongodb'
import { makeHookRegistration } from 'cortex/utility/hook'

export const hooks = makeHookRegistration<{
  up: (db: Db, client: MongoClient) => Promise<void>
}>()
