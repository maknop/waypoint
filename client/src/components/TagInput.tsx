import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function commit() {
    const tag = draft.trim().toLowerCase()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2 py-1.5 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700"
        >
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length ? '' : 'Add tags…'}
        className="min-w-24 flex-1 border-none px-1 py-0.5 text-sm outline-none"
      />
    </div>
  )
}
