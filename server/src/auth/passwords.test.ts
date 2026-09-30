import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './passwords.js'

describe('passwords', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword(hash, 'wrong password')).toBe(false)
  })

  it('salts hashes so the same password hashes differently each time', async () => {
    const a = await hashPassword('same input')
    const b = await hashPassword('same input')
    expect(a).not.toBe(b)
  })
})
