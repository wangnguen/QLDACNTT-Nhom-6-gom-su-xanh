import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, UsersRound } from 'lucide-react'
import type { WorkshopSummary } from '@lib/api'
import { cn, formatPrice, formatShortDate, formatTimeRange } from '@lib/utils'
import { ProductImage } from '@components/product'
import { availabilityLabel } from './availability'

export function WorkshopCard({ workshop }: { workshop: WorkshopSummary }) {
  const badge = availabilityLabel(workshop.availability, workshop.seatsLeft)

  return (
    <Link
      to={`/workshops/${workshop.slug}`}
      className='group flex flex-col overflow-hidden rounded-[var(--radius-organic)] border border-clay/60 bg-cream shadow-sm transition-shadow hover:shadow-[0_12px_32px_rgba(28,61,30,0.12)]'
    >
      <div className='relative aspect-[4/3] overflow-hidden'>
        <ProductImage
          src={workshop.imageUrl}
          alt={workshop.name}
          className='h-full w-full transition-transform duration-500 group-hover:scale-105'
        />
        <span className='absolute top-3 left-3 flex flex-col items-center rounded-2xl bg-cream/95 px-3 py-1.5 text-center shadow-sm'>
          <CalendarDays size={14} className='text-leaf' aria-hidden />
          <span className='text-xs font-bold text-moss'>{formatShortDate(workshop.startsAt)}</span>
        </span>
        {badge && (
          <span className={cn('absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold', badge.className)}>
            {badge.text}
          </span>
        )}
      </div>
      <div className='flex flex-1 flex-col gap-2 p-4'>
        <h3 className='line-clamp-2 font-semibold text-forest group-hover:text-teal'>{workshop.name}</h3>
        <ul className='space-y-1 text-sm text-ink'>
          <li className='flex items-center gap-2'>
            <Clock size={15} className='shrink-0 text-muted' aria-hidden />
            {formatTimeRange(workshop.startsAt, workshop.endsAt)}
          </li>
          <li className='flex items-center gap-2'>
            <MapPin size={15} className='shrink-0 text-muted' aria-hidden />
            <span className='truncate'>{workshop.location}</span>
          </li>
          <li className='flex items-center gap-2'>
            <UsersRound size={15} className='shrink-0 text-muted' aria-hidden />
            Còn {workshop.seatsLeft}/{workshop.capacity} chỗ
          </li>
        </ul>
        <p className='mt-auto pt-2 font-display text-xl font-bold text-moss'>
          {workshop.price > 0 ? formatPrice(workshop.price) : 'Miễn phí'}
          {workshop.price > 0 && <span className='ml-1 font-sans text-sm font-normal text-muted'>/ người</span>}
        </p>
      </div>
    </Link>
  )
}

export function WorkshopCardSkeleton() {
  return (
    <div className='overflow-hidden rounded-[var(--radius-organic)] border border-clay/60 bg-cream'>
      <div className='aspect-[4/3] animate-pulse bg-sand' />
      <div className='space-y-2 p-4'>
        <div className='h-4 w-4/5 animate-pulse rounded bg-sand' />
        <div className='h-3 w-1/2 animate-pulse rounded bg-sand' />
        <div className='h-3 w-2/3 animate-pulse rounded bg-sand' />
        <div className='h-6 w-1/3 animate-pulse rounded bg-sand' />
      </div>
    </div>
  )
}
