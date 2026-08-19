import { Router } from 'express'
import { db } from './db.js'
import type { Entry, EntryRow } from './types.js'

export const router = Router()

function rowToEntry(row: EntryRow): Entry {
  return { ...row, tags: JSON.parse(row.tags || '[]') }
}

router.get('/entries', (req, res) => {
  const { type, status, country_code, state_code, city_name, tag, q } = req.query as Record<string, string | undefined>

  const clauses: string[] = []
  const params: Record<string, unknown> = {}

  if (type) { clauses.push('type = @type'); params.type = type }
  if (status) { clauses.push('status = @status'); params.status = status }
  if (country_code) { clauses.push('country_code = @country_code'); params.country_code = country_code }
  if (state_code) { clauses.push('state_code = @state_code'); params.state_code = state_code }
  if (city_name) { clauses.push('city_name = @city_name'); params.city_name = city_name }
  if (tag) { clauses.push("tags LIKE @tag"); params.tag = `%"${tag}"%` }
  if (q) {
    clauses.push('(title LIKE @q OR notes LIKE @q OR city_name LIKE @q OR country_name LIKE @q)')
    params.q = `%${q}%`
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db.prepare(`SELECT * FROM entries ${where} ORDER BY created_at DESC`).all(params) as EntryRow[]
  res.json(rows.map(rowToEntry))
})

router.get('/entries/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id) as EntryRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(rowToEntry(row))
})

router.post('/entries', (req, res) => {
  const b = req.body as Partial<Entry>
  if (!b.title || !b.type || !b.country_code || !b.country_name) {
    return res.status(400).json({ error: 'title, type, country_code, and country_name are required' })
  }

  const info = db.prepare(`
    INSERT INTO entries (type, title, notes, status, rating, country_code, country_name, state_code, state_name, city_name, tags, link)
    VALUES (@type, @title, @notes, @status, @rating, @country_code, @country_name, @state_code, @state_name, @city_name, @tags, @link)
  `).run({
    type: b.type,
    title: b.title,
    notes: b.notes ?? '',
    status: b.status ?? 'favorite',
    rating: b.rating ?? null,
    country_code: b.country_code,
    country_name: b.country_name,
    state_code: b.state_code ?? null,
    state_name: b.state_name ?? null,
    city_name: b.city_name ?? null,
    tags: JSON.stringify(b.tags ?? []),
    link: b.link ?? null,
  })

  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(info.lastInsertRowid) as EntryRow
  res.status(201).json(rowToEntry(row))
})

router.put('/entries/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id) as EntryRow | undefined
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const b = req.body as Partial<Entry>
  const merged = { ...rowToEntry(existing), ...b, id: existing.id }

  db.prepare(`
    UPDATE entries SET
      type = @type, title = @title, notes = @notes, status = @status, rating = @rating,
      country_code = @country_code, country_name = @country_name,
      state_code = @state_code, state_name = @state_name, city_name = @city_name,
      tags = @tags, link = @link, updated_at = datetime('now')
    WHERE id = @id
  `).run({
    ...merged,
    tags: JSON.stringify(merged.tags ?? []),
  })

  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id) as EntryRow
  res.json(rowToEntry(row))
})

router.delete('/entries/:id', (req, res) => {
  const info = db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
})

router.get('/locations', (_req, res) => {
  const rows = db.prepare(`
    SELECT country_code, country_name, state_code, state_name, city_name, COUNT(*) as count
    FROM entries
    GROUP BY country_code, state_code, city_name
    ORDER BY country_name, state_name, city_name
  `).all()
  res.json(rows)
})

router.get('/tags', (_req, res) => {
  const rows = db.prepare('SELECT tags FROM entries').all() as { tags: string }[]
  const counts = new Map<string, number>()
  for (const row of rows) {
    const tags = JSON.parse(row.tags || '[]') as string[]
    for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  res.json([...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count))
})

router.get('/stats', (_req, res) => {
  const total = (db.prepare('SELECT COUNT(*) as c FROM entries').get() as { c: number }).c
  const favorites = (db.prepare("SELECT COUNT(*) as c FROM entries WHERE status = 'favorite'").get() as { c: number }).c
  const countries = (db.prepare('SELECT COUNT(DISTINCT country_code) as c FROM entries').get() as { c: number }).c
  const cities = (db.prepare('SELECT COUNT(DISTINCT city_name) as c FROM entries WHERE city_name IS NOT NULL').get() as { c: number }).c
  res.json({ total, favorites, countries, cities })
})
