import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { db } from '../db.js'
import type { PublicUser } from '../types.js'
import { authConfig } from './config.js'

export const SESSION_COOKIE = 'wp_session'

export function sessionCookieOptions(maxAgeMs?: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: authConfig.cookieSecure,
    path: '/',
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
  }
}

export function createSession(userId: number, req: Request): { token: string; maxAgeMs: number } {
  const token = crypto.randomBytes(32).toString('base64url')
  const maxAgeMs = authConfig.sessionTtlDays * 24 * 60 * 60 * 1000
  const expiresAt = new Date(Date.now() + maxAgeMs).toISOString()
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, user_agent, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, userId, expiresAt, req.headers['user-agent'] ?? null, req.ip ?? null)
  return { token, maxAgeMs }
}

export function destroySession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(token)
}

export function getUserBySession(token: string): PublicUser | null {
  const row = db.prepare(`
    SELECT u.id, u.email, u.display_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(token) as PublicUser | undefined
  return row ?? null
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined
  const user = token ? getUserBySession(token) : null
  if (!user) return res.status(401).json({ error: 'Authentication required' })
  req.user = user
  next()
}
