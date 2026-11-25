import { Star } from 'lucide-react'

// Số sao 1–5 (chỉ xem)
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className='inline-flex gap-0.5' role='img' aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= value ? 'fill-warning text-warning' : 'text-clay'}
          aria-hidden
        />
      ))}
    </span>
  )
}
