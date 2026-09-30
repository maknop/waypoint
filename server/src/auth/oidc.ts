import * as client from 'openid-client'
import { authConfig } from './config.js'

let configPromise: Promise<client.Configuration> | null = null

function getOidcClientConfig(): Promise<client.Configuration> {
  const oidc = authConfig.oidc
  if (!oidc) throw new Error('OIDC is not configured')
  if (!configPromise) {
    configPromise = client.discovery(new URL(oidc.issuerUrl), oidc.clientId, oidc.clientSecret)
  }
  return configPromise
}

export interface AuthorizationRequest {
  url: string
  codeVerifier: string
  state: string
}

export async function buildAuthorizationRequest(): Promise<AuthorizationRequest> {
  const oidc = authConfig.oidc
  if (!oidc) throw new Error('OIDC is not configured')
  const config = await getOidcClientConfig()

  const codeVerifier = client.randomPKCECodeVerifier()
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
  const state = client.randomState()

  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: oidc.redirectUri,
    scope: oidc.scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })

  return { url: url.toString(), codeVerifier, state }
}

export interface OidcIdentity {
  subject: string
  email: string | undefined
  emailVerified: boolean
  name: string | undefined
}

export async function handleCallback(currentUrl: URL, codeVerifier: string, expectedState: string): Promise<OidcIdentity> {
  const config = await getOidcClientConfig()
  const tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState,
  })

  const claims = tokens.claims()
  if (!claims) throw new Error('OIDC provider did not return an ID token')

  const userinfo = await client.fetchUserInfo(config, tokens.access_token, claims.sub)

  const email = (userinfo.email ?? claims.email) as string | undefined
  const emailVerifiedClaim = userinfo.email_verified ?? claims.email_verified
  const emailVerified = emailVerifiedClaim === undefined ? true : Boolean(emailVerifiedClaim)

  return {
    subject: claims.sub,
    email,
    emailVerified,
    name: (userinfo.name ?? claims.name) as string | undefined,
  }
}
