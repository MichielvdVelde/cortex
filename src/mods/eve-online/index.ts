import type { Manifest } from 'cortex/config/mods'
import './policy'

export const manifest: Manifest = {
  provides: null,
  dependencies: [
    'cortex/mods/eve-online/universe',
  ],
}
