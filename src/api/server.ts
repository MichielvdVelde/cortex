import type { State, Context } from '.'
import { Server } from 'http'
import Koa from 'koa'
import Router, { RouterOptions } from '@koa/router'
import { hooks } from './symbols'
import { installEndpointHandlers } from './install'
import { importMods } from 'cortex/config/mods'
import { closeClient } from 'cortex/storage/mongodb'
import { disconnect } from 'cortex/storage/redis'

await importMods('api')

// TODO: Parse host and port from command line arguments
const host = 'localhost'
const port = 3001

const opts: RouterOptions = process.env.NODE_ENV !== 'production' ? { prefix: '/api' } : {}
const app = new Koa<State, Context>()
const router = new Router<State, Context>(opts)
const server = new Server(app.callback())

hooks.makeIterated('middleware')(app, router)
installEndpointHandlers(router, ...hooks.map('route'))
app.use(router.routes())
app.use(router.allowedMethods())

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`)
})

process.on('SIGINT', () => {
  if (server.listening) {
    server.close()
  }

  closeClient()
  disconnect()
})
