import { Search } from 'lucide-react'
import { ENTRY_STATUSES, ENTRY_TYPES, type EntryStatus, type EntryType } from '../types'

interface FilterBarProps {
  q: string
  onQChange: (q: string) => void
  type: EntryType | ''
  onTypeChange: (type: EntryType | '') => void
  status: EntryStatus | ''
  onStatusChange: (status: EntryStatus | '') => void
}

export function FilterBar({ q, onQChange, type, onTypeChange, status, onStatusChange }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search entries…"
          className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
          <button
            onClick={() => onTypeChange('')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              type === '' ? 'bg-teal-600 text-white' : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            All
          </button>
          {ENTRY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                type === t.value ? 'bg-teal-600 text-white' : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as EntryStatus | '')}
          className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 outline-none focus:border-teal-500"
        >
          <option value="">Any status</option>
          {ENTRY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
