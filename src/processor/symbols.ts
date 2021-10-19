import type { Processor } from '.'
import { makeHookRegistration } from 'cortex/utility/hook'

export const hooks = makeHookRegistration<{
  processor: Processor,
}>()
