import { hooks } from 'cortex/api'
import bodyParser from 'koa-bodyparser'

// Register body parser middleware
hooks.register('middleware', app => {
  app.use(bodyParser({
    enableTypes: ['json'],
    jsonLimit: '128kb',
  }))
})
