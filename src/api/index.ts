import type Router from '@koa/router'
import type { AnySchema } from 'yup'

export { hooks } from './symbols'
export interface Context {}
export interface State {}
export type Method = 'get' | 'put' | 'post' | 'delete'
export type Middleware = Router.Middleware<State, Context>

export type Endpoint = {
  path: string,
  method?: Method,
  middleware?: Middleware[],
  schema?: AnySchema,
  execute: (context: Router.RouterContext<State, Context>) => Promise<any>,
}
