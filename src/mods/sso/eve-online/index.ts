import type { Manifest } from 'cortex/config/mods'
import type { Scope } from './types'
import './policy'
import { registerScopes } from './scopes'

export interface State {
  _id: string,
  link: boolean,
  ref?: string,
  accountId?: string,
  characterId?: number,
  createdOn: Date,
}

export interface Token {
  _id: string,
  allianceId?: number,
  characterId: number,
  corporationId: number,
  accessToken: string,
  refreshToken: string,
  expiresOn: Date,
  scopes: Scope[],
}

registerScopes('system', [
  'esi-search.search_structures.v1',
  'esi-universe.read_structures.v1',
])

export const manifest: Manifest = {
  provides: ['api'],
}
