import type { RouterContext } from '@koa/router'
import type { Filter } from 'mongodb'
import type { Policy, ToPolicy } from '.'
import type { State, Context } from 'cortex/api'
import type { MaybePromise } from 'cortex/utility/types'

const policyMap = new Map<string, Policy>()
const policyGroups = new Map<string, (context: RouterContext<State, Context>) => MaybePromise<string | number | { $in: string[] | number[] } | undefined>>()

/** Register a policy. */
export function registerPolicy(policy: Policy): void {
  if (!policy.resource && !policy.notResource) {
    throw new TypeError('Either "resource" or "notResource" must be specified')
  } else if (!policy.action && !policy.notAction) {
    throw new TypeError('Either "action" or "notAction" must be specified')
  }

  policyMap.set(policy._id, policy)
}

/** Get a list of registered policies. */
export function getPolicies() {
  return policyMap.values()
}

/** Register a policy group */
export function registerPolicyGroup(
  type: string,
  target: (context: RouterContext<State, Context>) => MaybePromise<string | number | { $in: string[] | number[] } | undefined>
): void {
  policyGroups.set(type, target)
}

export function getPolicyGroups() {
  return policyGroups.keys()
}

/** Create a group filter to find all policies. */
export async function createGroupFilter(
  context: RouterContext<State, Context>,
): Promise<Filter<ToPolicy>> {
  const filter: Filter<ToPolicy> = { $or: [] }
  for (const [type, fn] of policyGroups) {
    let target = fn(context)
    if (target instanceof Promise) {
      target = await target
    }
    if (target === undefined) {
      continue
    }
    filter.$or!.push({
      type,
      target,
    })
  }

  return filter
}
