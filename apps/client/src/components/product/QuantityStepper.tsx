import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@lib/utils'

interface Props {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'md' | 'sm'
  label?: string
}

// Ô số lượng có nút −/+; gõ trực tiếp thì áp dụng khi rời ô hoặc nhấn Enter, tự giới hạn trong [1, max]
export function QuantityStepper({ value, max, onChange, disabled, size = 'md', label = 'Số lượng' }: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    setDraft(null)
    const next = Math.min(Math.max(1, Math.floor(Number(raw)) || 1), Math.max(1, max))
    if (next !== value) onChange(next)
  }

  const button = cn(
    'flex items-center justify-center text-moss transition-colors hover:bg-moss/5 disabled:pointer-events-none disabled:opacity-35',
    size === 'md' ? 'h-11 w-11' : 'h-9 w-9'
  )

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-full border border-clay bg-cream',
        disabled && 'opacity-60'
      )}
    >
      <button
        type='button'
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label='Giảm số lượng'
      >
        <Minus size={16} />
      </button>
      <input
        type='number'
        inputMode='numeric'
        min={1}
        max={max}
        value={draft ?? value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
        disabled={disabled}
        aria-label={label}
        className={cn(
          'w-12 appearance-none bg-transparent text-center font-semibold text-forest outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
          size === 'sm' && 'w-10 text-sm'
        )}
      />
      <button
        type='button'
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label='Tăng số lượng'
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
