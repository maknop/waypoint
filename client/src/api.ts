import type { Entry, EntryDraft, LocationGroup, Stats, TagCount } from './types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface EntryFilters {
  type?: string
  status?: string
  country_code?: string
  state_code?: string
  city_name?: string
  tag?: string
  q?: string
}

function toQuery(filters: EntryFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  listEntries: (filters: EntryFilters = {}) => request<Entry[]>(`/entries${toQuery(filters)}`),
  getEntry: (id: number) => request<Entry>(`/entries/${id}`),
  createEntry: (draft: EntryDraft) => request<Entry>('/entries', { method: 'POST', body: JSON.stringify(draft) }),
  updateEntry: (id: number, draft: Partial<EntryDraft>) =>
    request<Entry>(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(draft) }),
  deleteEntry: (id: number) => request<void>(`/entries/${id}`, { method: 'DELETE' }),
  locations: () => request<LocationGroup[]>('/locations'),
  tags: () => request<TagCount[]>('/tags'),
  stats: () => request<Stats>('/stats'),
}
