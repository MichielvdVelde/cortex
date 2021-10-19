import type { Manifest } from 'cortex/config/mods'

export const manifest: Manifest = {
  provides: null,
  dependencies: [
    'cortex/mods/core/session',
    'cortex/mods/core/json',
    'cortex/mods/core/cors',
    'cortex/mods/core/bodyparser',
  ]
}
