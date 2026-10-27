import { Link } from 'react-router-dom'
import { cn } from '@lib/utils'

interface Props {
  className?: string
  inverted?: boolean
}

export function Logo({ className, inverted }: Props) {
  return (
    <Link to='/' className={cn('inline-flex items-center gap-3', className)}>
      <img src='/logo.png' alt='' className='h-11 w-11 rounded-full bg-cream object-cover ring-1 ring-moss/10' />
      <span
        className={cn(
          'font-display text-xl font-bold tracking-[0.12em] uppercase',
          inverted ? 'text-cream' : 'text-moss'
        )}
      >
        Gốm Sứ Xanh
      </span>
    </Link>
  )
}
