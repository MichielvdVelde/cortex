import type Koa from 'koa'
import type Router from '@koa/router'
import type { Context, Endpoint, State } from '.'
import { makeHookRegistration } from 'cortex/utility/hook'

export const hooks = makeHookRegistration<{
  route: Endpoint,
  middleware: (koa: Koa<State, Context>, router: Router<State, Context>) => void,
}>()
