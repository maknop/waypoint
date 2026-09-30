import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR ?? path.join(__dirname, '..', 'data')
fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(path.join(dataDir, 'waypoint.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    oidc_subject TEXT,
    oidc_issuer TEXT,
    display_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (password_hash IS NOT NULL OR (oidc_subject IS NOT NULL AND oidc_issuer IS NOT NULL))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oidc ON users(oidc_issuer, oidc_subject)
    WHERE oidc_issuer IS NOT NULL AND oidc_subject IS NOT NULL;

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('food', 'activity', 'lodging', 'note')),
    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'favorite' CHECK (status IN ('favorite', 'want_to_try', 'not_recommended')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    state_code TEXT,
    state_name TEXT,
    city_name TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    link TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_entries_country ON entries(country_code);
  CREATE INDEX IF NOT EXISTS idx_entries_state ON entries(state_code);
  CREATE INDEX IF NOT EXISTS idx_entries_city ON entries(city_name);
  CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
  CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
`)

// Instances that predate authentication have an `entries` table without
// `user_id`. `CREATE TABLE IF NOT EXISTS` above is a no-op for them, so add
// the column here (nullable — it's backfilled to the first registered user,
// see auth/routes.ts) rather than losing existing data.
const entryColumns = db.prepare(`PRAGMA table_info(entries)`).all() as { name: string }[]
if (!entryColumns.some((col) => col.name === 'user_id')) {
  db.exec(`ALTER TABLE entries ADD COLUMN user_id INTEGER REFERENCES users(id)`)
}
db.exec(`CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id)`)

db.prepare(`DELETE FROM sessions WHERE expires_at <= datetime('now')`).run()
