import type { RouterContext } from '@koa/router'
import type { Context, State, Middleware } from 'cortex/api'
import HttpErrors from 'http-errors'

export function protect(): Middleware {
  return async (context, next) => {
    if (!context.identity) {
      throw new HttpErrors.Unauthorized('Not logged in')
    }
    return next()
  }
}

export function enforce(
  resource: string | ((context: RouterContext<State, Context>) => string),
  action: string,
): Middleware {
  return async (context, next) => {
    if (!context.identity) {
      throw new HttpErrors.Unauthorized('Not logged in')
    }

    if (!context.identity.policy.evaluate({
      resource: typeof resource === 'string' ? resource : resource(context),
      action,
    })) {
      throw new HttpErrors.Forbidden('Inufficient access')
    }

    return next()
  }
}
