export interface OidcConfig {
  issuerUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
  displayName: string
  scope: string
}

export interface AuthConfig {
  allowedEmails: string[] | null
  sessionTtlDays: number
  cookieSecure: boolean
  oidc: OidcConfig | null
}

function loadOidcConfig(): OidcConfig | null {
  const issuerUrl = process.env.OIDC_ISSUER_URL
  const clientId = process.env.OIDC_CLIENT_ID
  const clientSecret = process.env.OIDC_CLIENT_SECRET
  if (!issuerUrl || !clientId || !clientSecret) return null

  const redirectUri = process.env.OIDC_REDIRECT_URI
    ?? (process.env.PUBLIC_BASE_URL ? `${process.env.PUBLIC_BASE_URL.replace(/\/$/, '')}/api/auth/oidc/callback` : undefined)
  if (!redirectUri) {
    throw new Error('OIDC is configured but neither OIDC_REDIRECT_URI nor PUBLIC_BASE_URL is set')
  }

  return {
    issuerUrl,
    clientId,
    clientSecret,
    redirectUri,
    displayName: process.env.OIDC_DISPLAY_NAME ?? 'SSO',
    scope: process.env.OIDC_SCOPE ?? 'openid email profile',
  }
}

function loadAuthConfig(): AuthConfig {
  const rawAllowedEmails = process.env.ALLOWED_EMAILS
  const allowedEmails = rawAllowedEmails
    ? rawAllowedEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : null

  return {
    allowedEmails: allowedEmails && allowedEmails.length > 0 ? allowedEmails : null,
    sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 30),
    cookieSecure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
    oidc: loadOidcConfig(),
  }
}

export const authConfig = loadAuthConfig()
