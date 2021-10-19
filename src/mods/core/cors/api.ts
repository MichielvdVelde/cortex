import { hooks } from 'cortex/api'
import conditional from 'koa-conditional-get'
import cors from '@koa/cors'
import etag from 'koa-etag'

// Enable conditional get
hooks.register('middleware', app => {
  app.use(conditional())
  app.use(etag())
})

// Only enable CORS in production
if (process.env.NODE_ENV === 'production') {
  hooks.register('middleware', app => {
    app.use(cors({
      credentials: true,
      exposeHeaders: ['X-Pages', 'X-Count'],
    }))
  })
}
