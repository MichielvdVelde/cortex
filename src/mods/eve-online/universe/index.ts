import type { Manifest } from 'cortex/config/mods'
import { registerScopes } from 'cortex/mods/eve-online/scopes'

registerScopes('open-window', ['esi-ui.open_window.v1'])
registerScopes('write-waypoint', ['esi-ui.write_waypoint.v1'])

export const manifest: Manifest = {
  provides: ['api'],
}
