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
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
