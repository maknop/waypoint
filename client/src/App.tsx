import { useCallback, useEffect, useState } from 'react'
import { Compass, LogOut, Plus } from 'lucide-react'
import { api, type AuthUser, type EntryFilters } from './api'
import type { Entry, EntryDraft, EntryStatus, EntryType, LocationGroup, Stats } from './types'
import { LocationSidebar, type LocationFilter } from './components/LocationSidebar'
import { FilterBar } from './components/FilterBar'
import { EntryCard } from './components/EntryCard'
import { EntryForm } from './components/EntryForm'

interface AppProps {
  user: AuthUser
}

export default function App({ user }: AppProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [locations, setLocations] = useState<LocationGroup[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [locationFilter, setLocationFilter] = useState<LocationFilter>({})
  const [q, setQ] = useState('')
  const [type, setType] = useState<EntryType | ''>('')
  const [status, setStatus] = useState<EntryStatus | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)

  const refreshSidebar = useCallback(() => {
    api.locations().then(setLocations).catch(() => {})
    api.stats().then(setStats).catch(() => {})
  }, [])

  const refreshEntries = useCallback(() => {
    const filters: EntryFilters = {
      q: q || undefined,
      type: type || undefined,
      status: status || undefined,
      country_code: locationFilter.country_code,
      state_code: locationFilter.state_code,
      city_name: locationFilter.city_name,
    }
    setLoading(true)
    api
      .listEntries(filters)
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [q, type, status, locationFilter])

  useEffect(() => { refreshSidebar() }, [refreshSidebar])
  useEffect(() => { refreshEntries() }, [refreshEntries])

  async function handleSave(draft: EntryDraft) {
    if (editing) {
      await api.updateEntry(editing.id, draft)
    } else {
      await api.createEntry(draft)
    }
    setFormOpen(false)
    setEditing(null)
    refreshEntries()
    refreshSidebar()
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"?`)) return
    await api.deleteEntry(entry.id)
    refreshEntries()
    refreshSidebar()
  }

  async function handleLogout() {
    await api.logout()
    window.location.reload()
  }

  const defaultLocation = locationFilter.country_code
    ? {
        country_code: locationFilter.country_code,
        country_name: locations.find((l) => l.country_code === locationFilter.country_code)?.country_name ?? '',
        state_code: locationFilter.state_code ?? null,
        state_name: locations.find((l) => l.state_code === locationFilter.state_code)?.state_name ?? null,
        city_name: locationFilter.city_name ?? null,
      }
    : undefined

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Compass size={18} />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight text-stone-900">Waypoint</h1>
              <p className="text-xs leading-tight text-stone-400">Your travel favorites, mapped</p>
            </div>
          </div>

          {stats && (
            <div className="hidden items-center gap-4 text-center text-xs text-stone-500 sm:flex">
              <div><span className="block text-sm font-semibold text-stone-800">{stats.total}</span>entries</div>
              <div><span className="block text-sm font-semibold text-stone-800">{stats.favorites}</span>favorites</div>
              <div><span className="block text-sm font-semibold text-stone-800">{stats.cities}</span>cities</div>
              <div><span className="block text-sm font-semibold text-stone-800">{stats.countries}</span>countries</div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditing(null); setFormOpen(true) }}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              <Plus size={16} /> Add entry
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="max-w-32 truncate text-xs text-stone-500" title={user.email}>
                {user.display_name ?? user.email}
              </span>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3">
            <LocationSidebar groups={locations} filter={locationFilter} onFilterChange={setLocationFilter} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <FilterBar q={q} onQChange={setQ} type={type} onTypeChange={setType} status={status} onStatusChange={setStatus} />

          {error && <p className="text-sm text-rose-600">{error}</p>}

          {!loading && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 py-20 text-center">
              <Compass size={28} className="mb-2 text-stone-300" />
              <p className="text-sm font-medium text-stone-500">
                {stats && stats.total > 0 ? 'No entries match your filters' : 'No entries yet'}
              </p>
              <p className="text-xs text-stone-400">
                {stats && stats.total > 0 ? 'Try clearing a filter.' : 'Add your first favorite place to get started.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => { setEditing(entry); setFormOpen(true) }}
                onDelete={() => handleDelete(entry)}
              />
            ))}
          </div>
        </main>
      </div>

      {formOpen && (
        <EntryForm
          initial={editing}
          defaultLocation={defaultLocation}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
