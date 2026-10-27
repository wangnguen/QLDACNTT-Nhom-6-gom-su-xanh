import { Link } from 'react-router-dom'
import { cn } from '@lib/utils'

interface Props {
  className?: string
  inverted?: boolean
}

export function Logo({ className, inverted }: Props) {
  return (
    <Link to='/' className={cn('inline-flex items-center gap-3', className)}>
      <img src='/logo.png' alt='' className='h-10 w-10 rounded-full bg-cream object-cover ring-1 ring-moss/10' />
      <span className='leading-tight'>
        <span
          className={cn(
            'block font-display text-lg font-bold tracking-[0.12em] uppercase',
            inverted ? 'text-cream' : 'text-moss'
          )}
        >
          Gốm Sứ Xanh
        </span>
        <span className={cn('block text-xs font-semibold', inverted ? 'text-mint/80' : 'text-muted')}>
          Trang quản trị
        </span>
      </span>
    </Link>
  )
}
