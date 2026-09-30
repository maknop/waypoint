import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { Express } from 'express'

let app: Express
let tempDir: string

beforeAll(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'waypoint-test-'))
  process.env.DATA_DIR = tempDir
  const { createApp } = await import('./app.js')
  app = createApp()
})

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('auth + per-account entry scoping', () => {
  it('rejects entry requests with no session', async () => {
    await request(app).get('/api/entries').expect(401)
  })

  it('rejects a duplicate registration for the same email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'correcthorse' })
      .expect(201)

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'whatever123' })
      .expect(409)
  })

  it('rejects login with the wrong password', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send({ email: 'dave@example.com', password: 'correcthorse' }).expect(201)
    await agent.post('/api/auth/logout').expect(204)
    await agent.post('/api/auth/login').send({ email: 'dave@example.com', password: 'nope' }).expect(401)
  })

  it('invalidates the session on logout', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send({ email: 'erin@example.com', password: 'correcthorse' }).expect(201)
    await agent.get('/api/entries').expect(200)
    await agent.post('/api/auth/logout').expect(204)
    await agent.get('/api/entries').expect(401)
  })

  it('scopes entries to the account that created them', async () => {
    const aliceAgent = request.agent(app)
    await aliceAgent.post('/api/auth/register').send({ email: 'bob@example.com', password: 'correcthorse' }).expect(201)
    const aliceEntry = await aliceAgent
      .post('/api/entries')
      .send({ title: "Alice's Ramen", type: 'food', country_code: 'JP', country_name: 'Japan' })
      .expect(201)

    const bobAgent = request.agent(app)
    await bobAgent.post('/api/auth/register').send({ email: 'frank@example.com', password: 'correcthorse' }).expect(201)
    await bobAgent
      .post('/api/entries')
      .send({ title: "Frank's Cafe", type: 'food', country_code: 'US', country_name: 'United States' })
      .expect(201)

    const aliceEntries = await aliceAgent.get('/api/entries').expect(200)
    expect(aliceEntries.body).toHaveLength(1)
    expect(aliceEntries.body[0].title).toBe("Alice's Ramen")

    const bobEntries = await bobAgent.get('/api/entries').expect(200)
    expect(bobEntries.body).toHaveLength(1)
    expect(bobEntries.body[0].title).toBe("Frank's Cafe")

    // Bob can't reach Alice's entry by id — 404, not 403, so existence isn't leaked.
    await bobAgent.get(`/api/entries/${aliceEntry.body.id}`).expect(404)
  })
})
