import type Router from '@koa/router'
import type { Endpoint } from 'cortex/api'
import HttpErrors from 'http-errors'

declare module 'koa' {
  interface Request {
    originalBody?: any
  }
}

export function installEndpointHandlers(router: Router, ...endpoints: Endpoint[]): void {
  for (const endpoint of endpoints) {
    if (endpoint.middleware?.length) {
      // Apply route middleware
      router[endpoint.method ?? 'get'](endpoint.path, ...endpoint.middleware)
    }

    if (endpoint.schema && endpoint.method) {
      // Apply validation and casting middleware
      router[endpoint.method](endpoint.path, async (context, next) => {
        if (!await endpoint.schema!.isValid(context.request.body)) {
          throw new HttpErrors.BadRequest('Schema validation failed')
        } else {
          context.request.originalBody = context.request.body
          context.request.body = await endpoint.schema!.cast(context.request.body)
        }
        return next()
      })
    }

    router[endpoint.method ?? 'get'](endpoint.path, async (context, next) => {
      const result = await endpoint.execute(context)

      if (result === undefined) {
        return next()
      } else if (result === true) {
        context.body = { ok: 1 }
      } else if (result === false) {
        context.body = { ok: 0 }
      } else {
        context.body = result
      }
    })
  }
}
