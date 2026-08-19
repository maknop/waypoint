export type EntryType = 'food' | 'activity' | 'lodging' | 'note'
export type EntryStatus = 'favorite' | 'want_to_try' | 'not_recommended'

export interface Entry {
  id: number
  type: EntryType
  title: string
  notes: string
  status: EntryStatus
  rating: number | null
  country_code: string
  country_name: string
  state_code: string | null
  state_name: string | null
  city_name: string | null
  tags: string[]
  link: string | null
  created_at: string
  updated_at: string
}

export type EntryDraft = Omit<Entry, 'id' | 'created_at' | 'updated_at'>

export interface LocationGroup {
  country_code: string
  country_name: string
  state_code: string | null
  state_name: string | null
  city_name: string | null
  count: number
}

export interface TagCount {
  tag: string
  count: number
}

export interface Stats {
  total: number
  favorites: number
  countries: number
  cities: number
}

export const ENTRY_TYPES: { value: EntryType; label: string; icon: string }[] = [
  { value: 'food', label: 'Food', icon: 'utensils' },
  { value: 'activity', label: 'Activity', icon: 'compass' },
  { value: 'lodging', label: 'Lodging', icon: 'bed' },
  { value: 'note', label: 'Note', icon: 'notebook' },
]

export const ENTRY_STATUSES: { value: EntryStatus; label: string }[] = [
  { value: 'favorite', label: 'Favorite' },
  { value: 'want_to_try', label: 'Want to try' },
  { value: 'not_recommended', label: 'Not recommended' },
]
