import type { Job, JobsOptions } from 'bullmq'

export { hooks } from './symbols'

export type Processor = {
  pipe: string,
  name: string,
  options?: JobsOptions,
  data?: any,
  execute(job: Job): Promise<any>
}
