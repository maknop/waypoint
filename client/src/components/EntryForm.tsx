import { useState } from 'react'
import { X } from 'lucide-react'
import type { Entry, EntryDraft, EntryStatus, EntryType } from '../types'
import { ENTRY_STATUSES, ENTRY_TYPES } from '../types'
import { LocationPicker, type LocationValue } from './LocationPicker'
import { StarRating } from './StarRating'
import { TagInput } from './TagInput'

interface EntryFormProps {
  initial: Entry | null
  defaultLocation?: LocationValue
  onSave: (draft: EntryDraft) => Promise<void>
  onClose: () => void
}

const emptyLocation: LocationValue = {
  country_code: '',
  country_name: '',
  state_code: null,
  state_name: null,
  city_name: null,
}

export function EntryForm({ initial, defaultLocation, onSave, onClose }: EntryFormProps) {
  const [type, setType] = useState<EntryType>(initial?.type ?? 'food')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [status, setStatus] = useState<EntryStatus>(initial?.status ?? 'favorite')
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null)
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [link, setLink] = useState(initial?.link ?? '')
  const [location, setLocation] = useState<LocationValue>(
    initial
      ? {
          country_code: initial.country_code,
          country_name: initial.country_name,
          state_code: initial.state_code,
          state_name: initial.state_name,
          city_name: initial.city_name,
        }
      : defaultLocation ?? emptyLocation,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Title is required')
    if (!location.country_code) return setError('Country is required')
    setSaving(true)
    setError(null)
    try {
      await onSave({
        type,
        title: title.trim(),
        notes: notes.trim(),
        status,
        rating,
        tags,
        link: link.trim() || null,
        ...location,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-900/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {initial ? 'Edit entry' : 'Add entry'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-stone-400 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {ENTRY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-lg border px-2 py-1.5 text-sm font-medium transition ${
                    type === t.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ichiran Ramen"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Location</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What made it memorable?"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EntryStatus)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                {ENTRY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Rating</label>
              <div className="pt-2">
                <StarRating value={rating} onChange={setRating} size={20} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Tags</label>
            <TagInput value={tags} onChange={setTags} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Link (optional)</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save entry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
