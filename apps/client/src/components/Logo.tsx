import { Link } from 'react-router-dom'
import { cn } from '@lib/utils'

interface Props {
  className?: string
  inverted?: boolean
  // Màn hình nhỏ chỉ hiện biểu tượng, nhường chỗ cho menu trên header
  compact?: boolean
}

export function Logo({ className, inverted, compact }: Props) {
  return (
    <Link to='/' className={cn('inline-flex shrink-0 items-center gap-3', className)}>
      <img src='/logo.png' alt='' className='h-11 w-11 rounded-full bg-cream object-cover ring-1 ring-moss/10' />
      <span
        className={cn(
          'font-display text-xl font-bold tracking-[0.12em] whitespace-nowrap uppercase',
          compact && 'sr-only sm:not-sr-only',
          inverted ? 'text-cream' : 'text-moss'
        )}
      >
        Gốm Sứ Xanh
      </span>
    </Link>
  )
}
