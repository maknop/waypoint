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

export interface EntryRow extends Omit<Entry, 'tags'> {
  tags: string
}
