import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import type { PublicUser, User } from '../types.js'
import { isEmailAllowed } from './access.js'
import { authConfig } from './config.js'
import { buildAuthorizationRequest, handleCallback } from './oidc.js'
import { hashPassword, verifyPassword } from './passwords.js'
import { createSession, destroySession, getUserBySession, SESSION_COOKIE, sessionCookieOptions } from './sessions.js'

export const authRouter = Router()

const OIDC_TXN_COOKIE = 'wp_oidc_txn'
const OIDC_TXN_MAX_AGE_MS = 10 * 60 * 1000

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, display_name: user.display_name }
}

function findUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined
}

/** Attaches all pre-existing entries to the first account ever created on this instance. */
function backfillIfFirstUser(userId: number) {
  const { c } = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (c === 1) {
    db.prepare('UPDATE entries SET user_id = ? WHERE user_id IS NULL').run(userId)
  }
}

function signIn(res: Response, userId: number, req: Request) {
  const { token, maxAgeMs } = createSession(userId, req)
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(maxAgeMs))
}

authRouter.get('/providers', (_req, res) => {
  res.json({
    local: true,
    oidc: authConfig.oidc ? { name: authConfig.oidc.displayName } : false,
  })
})

authRouter.get('/me', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  const user = getUserBySession(token)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  res.json(user)
})

authRouter.post('/register', async (req, res) => {
  const { email: rawEmail, password } = req.body as { email?: string; password?: string }
  if (!rawEmail || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const email = normalizeEmail(rawEmail)
  if (!isEmailAllowed(email)) {
    return res.status(403).json({ error: 'Registration is not open for this email' })
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await hashPassword(password)
  const info = db.prepare(`
    INSERT INTO users (email, password_hash) VALUES (?, ?)
  `).run(email, passwordHash)
  const userId = Number(info.lastInsertRowid)
  backfillIfFirstUser(userId)

  signIn(res, userId, req)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User
  res.status(201).json(toPublicUser(user))
})

authRouter.post('/login', async (req, res) => {
  const { email: rawEmail, password } = req.body as { email?: string; password?: string }
  if (!rawEmail || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const email = normalizeEmail(rawEmail)
  if (!isEmailAllowed(email)) {
    return res.status(403).json({ error: 'This account is not permitted to log in' })
  }

  const user = findUserByEmail(email)
  const invalid = () => res.status(401).json({ error: 'Invalid email or password' })
  if (!user || !user.password_hash) return invalid()

  const valid = await verifyPassword(user.password_hash, password)
  if (!valid) return invalid()

  signIn(res, user.id, req)
  res.json(toPublicUser(user))
})

authRouter.post('/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined
  if (token) destroySession(token)
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions())
  res.status(204).end()
})

authRouter.get('/oidc/start', async (req, res) => {
  if (!authConfig.oidc) return res.status(404).json({ error: 'SSO is not configured' })

  const { url, codeVerifier, state } = await buildAuthorizationRequest()
  res.cookie(OIDC_TXN_COOKIE, JSON.stringify({ codeVerifier, state }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: authConfig.cookieSecure,
    path: '/api/auth/oidc',
    maxAge: OIDC_TXN_MAX_AGE_MS,
  })
  res.redirect(url)
})

authRouter.get('/oidc/callback', async (req, res) => {
  const fail = (message: string) => res.redirect(`/?authError=${encodeURIComponent(message)}`)

  if (!authConfig.oidc) return fail('SSO is not configured')

  const raw = req.cookies?.[OIDC_TXN_COOKIE] as string | undefined
  res.clearCookie(OIDC_TXN_COOKIE, { path: '/api/auth/oidc' })
  if (!raw) return fail('Your sign-in attempt expired. Please try again.')

  let txn: { codeVerifier: string; state: string }
  try {
    txn = JSON.parse(raw)
  } catch {
    return fail('Your sign-in attempt was invalid. Please try again.')
  }

  try {
    const currentUrl = new URL(req.originalUrl, authConfig.oidc.redirectUri)
    const identity = await handleCallback(currentUrl, txn.codeVerifier, txn.state)

    if (!identity.emailVerified) {
      return fail('Your identity provider account email is not verified.')
    }
    if (!identity.email) {
      return fail('Your identity provider did not share an email address.')
    }

    const email = normalizeEmail(identity.email)
    if (!isEmailAllowed(email)) {
      return fail('This account is not permitted to log in.')
    }

    let user = db.prepare(`
      SELECT * FROM users WHERE oidc_issuer = ? AND oidc_subject = ?
    `).get(authConfig.oidc.issuerUrl, identity.subject) as User | undefined

    if (!user) {
      const existingLocal = findUserByEmail(email)
      if (existingLocal) {
        // An IdP vouches for this email, so it's safe to attach SSO to an
        // existing password account. The reverse (a plain registration
        // claiming someone else's OIDC email) is never allowed — see
        // POST /register's 409 on an existing email.
        db.prepare(`
          UPDATE users SET oidc_issuer = ?, oidc_subject = ?, updated_at = datetime('now') WHERE id = ?
        `).run(authConfig.oidc.issuerUrl, identity.subject, existingLocal.id)
        user = { ...existingLocal, oidc_issuer: authConfig.oidc.issuerUrl, oidc_subject: identity.subject }
      } else {
        const info = db.prepare(`
          INSERT INTO users (email, oidc_issuer, oidc_subject, display_name) VALUES (?, ?, ?, ?)
        `).run(email, authConfig.oidc.issuerUrl, identity.subject, identity.name ?? null)
        const userId = Number(info.lastInsertRowid)
        backfillIfFirstUser(userId)
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User
      }
    }

    signIn(res, user.id, req)
    res.redirect('/')
  } catch (err) {
    console.error('OIDC callback failed:', err)
    fail('Sign-in failed. Please try again.')
  }
})
