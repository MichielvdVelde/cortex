import { Queue, QueueEvents } from 'bullmq'
import { getClient } from 'cortex/storage/mongodb'
import { getConnection } from 'cortex/storage/redis'
import { hooks } from './symbols'

process.argv.splice(1, 1)
const [pipe, name] = process.argv[1].split(':')
const processor = [...hooks.map('processor')].find(p => p.pipe === pipe && p.name === name)

if (!processor) {
  console.log(`Unknown processor: ${process.argv[1]}`)
} else {
  const queue = new Queue(pipe, {
    connection: await getConnection(),
    sharedConnection: true,
  })

  const events = new QueueEvents(pipe, {
    connection: await getConnection(),
    sharedConnection: true,
  })

  const job = await queue.add(name, null, {
    ...(processor.options ?? {}),
    // Delete repeat and delay options so the job
    // is executed immediately and only once
    repeat: undefined,
    delay: undefined
  })

  try {
    await job.waitUntilFinished(events)
    console.log('Processor executed')
  } catch (err: any) {
    console.error(err)
  }

  await queue.close()
  await events.close()
  ;(await getConnection()).disconnect()
  ;(await getClient()).close()
}
