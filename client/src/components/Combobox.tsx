import { useEffect, useMemo, useRef, useState } from 'react'
import type { Option } from '../location'
import { ChevronDown, X } from 'lucide-react'

interface ComboboxProps {
  options: Option[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function Combobox({ options, value, onChange, placeholder, disabled }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  )

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
    return base.slice(0, 150)
  }, [options, query])

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 pr-16 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-stone-100 disabled:text-stone-400"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => { onChange(null); setQuery('') }}
              className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} className="text-stone-400" />
        </div>
      </div>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-stone-400">No matches</div>
          )}
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
              className="block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-teal-50"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
