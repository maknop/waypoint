import { authConfig } from './config.js'

export function isEmailAllowed(email: string): boolean {
  if (!authConfig.allowedEmails) return true
  return authConfig.allowedEmails.includes(email.toLowerCase())
}
