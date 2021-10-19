import { randomBytes } from 'crypto'
import { hooks } from 'cortex/api'
import session from 'koa-session'
import * as Fn from 'cortex/utility/functional'

const KEYS = 4
const KEY_SIZE = 32
const KEY_ENCODING = 'hex'

hooks.register('middleware', app => {
  let keys: string[] = []
  if (!process.env.SESSION_KEYS) {
    console.log('SESSION_KEYS not set. Generating keys. This will cause login issues the next time the server is started!')
    Fn.times(KEYS, () => keys.push(randomBytes(KEY_SIZE).toString(KEY_ENCODING)))
  } else {
    keys = process.env.SESSION_KEYS!.split(',')
  }

  app.keys = keys
  app.use(session({ key: process.env.SESSION_KEY ?? 'cortex.sess' }, app as any))
})
