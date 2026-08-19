import { Bed, Compass, ExternalLink, MapPin, NotebookText, Pencil, Trash2, Utensils } from 'lucide-react'
import type { Entry } from '../types'
import { StarRating } from './StarRating'

const TYPE_ICON = {
  food: Utensils,
  activity: Compass,
  lodging: Bed,
  note: NotebookText,
} as const

const TYPE_COLOR = {
  food: 'bg-orange-100 text-orange-600',
  activity: 'bg-teal-100 text-teal-600',
  lodging: 'bg-violet-100 text-violet-600',
  note: 'bg-stone-200 text-stone-600',
} as const

const STATUS_BADGE = {
  favorite: 'bg-amber-100 text-amber-800',
  want_to_try: 'bg-sky-100 text-sky-800',
  not_recommended: 'bg-rose-100 text-rose-800',
} as const

const STATUS_LABEL = {
  favorite: '★ Favorite',
  want_to_try: 'Want to try',
  not_recommended: 'Not recommended',
} as const

interface EntryCardProps {
  entry: Entry
  onEdit: () => void
  onDelete: () => void
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const Icon = TYPE_ICON[entry.type]
  const location = [entry.city_name, entry.state_name, entry.country_name].filter(Boolean).join(', ')

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TYPE_COLOR[entry.type]}`}>
            <Icon size={16} />
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[entry.status]}`}>
            {STATUS_LABEL[entry.status]}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={onEdit} className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold leading-tight text-stone-900">{entry.title}</h3>
        {location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
            <MapPin size={12} /> {location}
          </p>
        )}
      </div>

      {entry.notes && <p className="line-clamp-3 text-sm text-stone-600">{entry.notes}</p>}

      {entry.rating && <StarRating value={entry.rating} size={14} />}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
              {tag}
            </span>
          ))}
        </div>
      )}

      {entry.link && (
        <a
          href={entry.link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline"
        >
          <ExternalLink size={12} /> View link
        </a>
      )}
    </div>
  )
}
