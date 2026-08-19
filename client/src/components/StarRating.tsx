import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number | null
  onChange?: (value: number | null) => void
  size?: number
}

export function StarRating({ value, onChange, size = 16 }: StarRatingProps) {
  const interactive = !!onChange
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(value === n ? null : n)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={value && n <= value ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
          />
        </button>
      ))}
    </div>
  )
}
