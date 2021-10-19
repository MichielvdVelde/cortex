import type { IdentityBasedPolicy } from 'iam-policies'
import type { RouterContext } from '@koa/router'
import type { Manifest } from 'cortex/config/mods'
import type { Role } from 'cortex/mods/sso/eve-online/types'
import './policy'

declare module 'cortex/api' {
  interface Identity {
    accountId: string,
    allianceId?: number,
    characterId: number,
    corporationId: number,
    roles?: Role[],
    titles?: number[],
    policy: IdentityBasedPolicy<RouterContext<State, Context>>,
  }

  interface Context {
    identity?: Identity,
  }
}

export interface Account {
  _id: string,
  createdBy: number,
  createdOn: Date,
}

export interface User {
  _id: number,
  accountId: string,
  owner: string,
  isBanned: boolean,
}

export interface Policy {
  _id: string,
  name: string,
  description: string,
  effect: 'allow' | 'deny',
  resource?: string[],
  notResource?: string[],
  action?: string[],
  notAction?: string[],
}

export interface ToPolicy {
  _id: string,
  type: 'account' | 'character' | 'corporation' | 'alliance' | 'role' | 'title' | 'scope',
  target: string | number,
  policies: string[],
}

export const manifest: Manifest = {
  provides: ['api', 'storage'],
  dependencies: [
    'cortex/mods/sso/eve-online'
  ],
}
