import { array2object } from 'cortex/utility/utility'
import IORedis from 'ioredis'
import { Deferred } from 'cortex/utility/async'

const connection = new IORedis(process.env.REDIS_URL!, { lazyConnect: true })

let deferred: Deferred<IORedis.Redis> | undefined
let connected = false

export async function getConnection() {
  if (!connected) {
    if (!deferred) {
      deferred = new Deferred<IORedis.Redis>()
      await connection.connect()
      connected = true
      deferred.resolve(connection)
      deferred = undefined
      return connection
    } else {
      return deferred.promise
    }
  } else {
    return connection
  }
}

const wait = (ms?: number) => new Promise<void>(resolve => setTimeout(resolve, ms ?? 5000))
const immediate = () => new Promise<void>(resolve => setImmediate(resolve))

/**
 * Read from a stream
 */
export async function* read<
  Type extends Record<string, any>
>(name: string, options?: {
  id?: string,
  abort?: AbortSignal,
  blockTime?: number,
}): AsyncIterableIterator<Type> {
  const conn = (await getConnection()).duplicate()
  let reading = true
  let lastId = options?.id ?? '$'

  if (options?.abort) {
    options.abort.addEventListener('abort', () => reading = false, { once: true })
  }

  while(reading) {
    try {
      const results = await conn.xread('BLOCK', options?.blockTime ?? 5000, 'STREAMS', name, lastId)

      if (!results) {
        await wait()
        continue
      }

      if (reading) {
        for (const entry of results[0][1]) {
          lastId = entry[0]
          yield array2object<Type>(entry[1])
        }
      }

      await immediate()
    } catch (err: any) {
      if (err.message !== 'Connection is closed.') {
        reading = false
        conn.disconnect()
        throw err
      }

      await wait()
    }
  }

  conn.disconnect()
}

export function disconnect() {
  if  (connected) {
    connection.disconnect()
  }
}
