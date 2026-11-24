import { Star } from 'lucide-react'
import { cn } from '@lib/utils'

interface Props {
  // Điểm 0–5, có thể lẻ (điểm trung bình)
  value: number
  size?: number
  className?: string
}

// Hiện số sao (chỉ xem); sao lẻ tô một phần
export function StarRating({ value, size = 16, className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role='img' aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - star + 1))
        return (
          <span key={star} className='relative inline-block' style={{ width: size, height: size }}>
            <Star size={size} className='absolute inset-0 text-clay' aria-hidden />
            <span className='absolute inset-0 overflow-hidden' style={{ width: `${fill * 100}%` }}>
              <Star size={size} className='fill-warning text-warning' aria-hidden />
            </span>
          </span>
        )
      })}
    </span>
  )
}

interface InputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const LABELS = ['', 'Rất tệ', 'Chưa hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']

// Chọn số sao khi đánh giá
export function StarInput({ value, onChange, disabled }: InputProps) {
  return (
    <div className='flex items-center gap-3'>
      <div role='radiogroup' aria-label='Số sao' className='flex gap-1'>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type='button'
            role='radio'
            aria-checked={value === star}
            aria-label={`${star} sao — ${LABELS[star]}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className='rounded-md p-0.5 transition-transform hover:scale-110 disabled:opacity-50'
          >
            <Star size={28} className={star <= value ? 'fill-warning text-warning' : 'text-clay'} aria-hidden />
          </button>
        ))}
      </div>
      {value > 0 && <span className='text-sm font-semibold text-ink'>{LABELS[value]}</span>}
    </div>
  )
}
