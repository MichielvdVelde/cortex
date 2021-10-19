import { STATUS_CODES } from 'http'
import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'

hooks.register('middleware', app => {
  // Cast errors to JSON
  app.use(async (context, next) => {
    try {
      await next()
    } catch (err: any) {
      const originalError = err
      if (!HttpErrors.isHttpError(err)) {
        err = new HttpErrors.InternalServerError()
      }

      context.response.status = err.status
      context.response.body = {
        error: err.expose ? err.message : STATUS_CODES[err.code]
      }

      if (err.status >= 500 && err.status <= 599) {
        // Log server errors
        console.error(originalError)
      }
    }
  })

  // Cast 404 to JSON
  app.use(async (context, next) => {
    await next()

    if (context.response.status === 404 && !context.response.body) {
      context.response.body = {
        error: 'Not Found'
      }
    }
  })
})
