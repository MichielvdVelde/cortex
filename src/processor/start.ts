import type { Processor as BullProcessor } from 'bullmq'
import type { Processor } from '.'
import { Worker, Queue, QueueScheduler } from 'bullmq'
import { getConnection } from 'cortex/storage/redis'
import { hooks } from './symbols'
import Fn from 'cortex/utility/functional'

function makeProcessor(pipe: string): BullProcessor {
  return async job => {
    const processor = byPipe.get(pipe)?.find(p => p.name === job.name)
    if (!processor) {
      throw new Error(`Missing processor for "${pipe}:${job.name}"`)
    }
    return processor.execute(job)
  }
}

const byPipe = new Map<string, Processor[]>()
const workers = new Map<string, Worker>()
const schedulers = new Map<string, QueueScheduler>()

for (const processor of hooks.map('processor')) {
  if (!byPipe.has(processor.pipe)) {
    byPipe.set(processor.pipe, [processor])
  } else {
    byPipe.get(processor.pipe)!.push(processor)
  }

  if (!workers.has(processor.pipe)) {
    workers.set(processor.pipe, new Worker(processor.pipe, makeProcessor(processor.pipe), {
      connection: await getConnection(),
      sharedConnection: true,
    }))
  }

  if (!schedulers.has(processor.pipe)) {
    schedulers.set(processor.pipe, new QueueScheduler(processor.pipe, {
      connection: await getConnection(),
      sharedConnection: true,
    }))
  }

  if (processor.options?.repeat) {
    const queue = new Queue(processor.pipe, {
      connection: await getConnection(),
      sharedConnection: true,
    })

    await queue.add(processor.name, processor.data ?? null, processor.options)
    await queue.close()
  }
}

process.once('SIGINT', () => {
  Fn.map(workers.values(), worker => worker.close())
  Fn.map(schedulers.values(), scheduler => scheduler.close())
  getConnection().then(connection => connection.disconnect())
})

console.log(`Started ${workers.size} worker(s)`)
