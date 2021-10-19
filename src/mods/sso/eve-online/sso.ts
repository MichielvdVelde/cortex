import SingleSignOn from 'eve-sso'

const sso = new (SingleSignOn as any).default(
  process.env.EVE_SSO_CLIENT_ID,
  process.env.EVE_SSO_SECRET_KEY,
  process.env.EVE_SSO_CALLBACK_URL,
) as SingleSignOn

export function generateRedirectUrl(state: string, scope: string | string[]): string {
  return sso.getRedirectUrl(state, scope)
}

export function exchangeCode(code: string, init?: {
  isRefreshToken?: boolean,
}) {
  return sso.getAccessToken(code, init?.isRefreshToken)
}
