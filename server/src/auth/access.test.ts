import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `authConfig` (in ./config.ts) is a module-level singleton computed from
// process.env at import time, so each scenario sets the env var and then
// re-imports a fresh module instance via vi.resetModules().
async function loadIsEmailAllowed() {
  const mod = await import('./access.js')
  return mod.isEmailAllowed
}

describe('isEmailAllowed', () => {
  const originalAllowedEmails = process.env.ALLOWED_EMAILS

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (originalAllowedEmails === undefined) delete process.env.ALLOWED_EMAILS
    else process.env.ALLOWED_EMAILS = originalAllowedEmails
  })

  it('allows any email when ALLOWED_EMAILS is unset', async () => {
    delete process.env.ALLOWED_EMAILS
    const isEmailAllowed = await loadIsEmailAllowed()
    expect(isEmailAllowed('anyone@example.com')).toBe(true)
  })

  it('allows only emails on the list, case-insensitively', async () => {
    process.env.ALLOWED_EMAILS = 'alice@example.com, Bob@Example.com'
    const isEmailAllowed = await loadIsEmailAllowed()
    expect(isEmailAllowed('alice@example.com')).toBe(true)
    expect(isEmailAllowed('BOB@EXAMPLE.COM')).toBe(true)
    expect(isEmailAllowed('charlie@example.com')).toBe(false)
  })
})
