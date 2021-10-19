import type { Scope } from './types'
import { deduplicate } from 'cortex/utility/utility'

const scopeMap: Record<string, Scope[]> = {}

/** Register one or more scopes under the given name. */
export function registerScopes(name: string, scopes: Scope[]) {
  if (!scopeMap[name]) {
    scopeMap[name] = scopes
  } else {
    scopeMap[name] = deduplicate(scopeMap[name], scopes)
  }
}

/** Get all scopes for the given names. Scopes are deduplicated. */
export function getScopesFor(...names: string[]) {
  const scopes: Scope[] = []
  for (const name of names) {
    if (scopeMap[name]) {
      for (const scope of scopeMap[name]) {
        if (!scopes.includes(scope)) {
          scopes.push(scope)
        }
      }
    }
  }
  return scopes
}
