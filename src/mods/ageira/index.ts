import type { Manifest } from 'cortex/config/mods'

export const manifest: Manifest = {
  provides: null,
  dependencies: [
    'cortex/mods/core',
    'cortex/mods/auth',
    'cortex/mods/auth/admin',
    'cortex/mods/sso/eve-online',
    'cortex/mods/eve-online',
  ],
}
