import type { Policy } from '.'

const policyMap = new Map<string, Policy>()

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
