import type { WorkshopAvailability, WorkshopSummary } from '@lib/api'
import { cn } from '@lib/utils'

const AVAILABILITY: Record<WorkshopAvailability, { label: string; className: string }> = {
  open: { label: 'Đang nhận', className: 'bg-teal/10 text-teal' },
  full: { label: 'Hết chỗ', className: 'bg-warning/10 text-warning' },
  closed: { label: 'Đã đóng', className: 'bg-clay/40 text-muted' }
}

// Số chỗ đã đặt / tổng số chỗ, thanh tiến độ và trạng thái nhận đăng ký
export function SeatsCell({ workshop }: { workshop: WorkshopSummary }) {
  const percent = Math.min(100, Math.round((workshop.bookedSeats / workshop.capacity) * 100))
  const availability = AVAILABILITY[workshop.availability]

  return (
    <div className='min-w-32'>
      <div className='flex items-center justify-between gap-2'>
        <span className='font-semibold text-forest'>
          {workshop.bookedSeats}/{workshop.capacity}
        </span>
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', availability.className)}>
          {availability.label}
        </span>
      </div>
      <div
        className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand'
        role='progressbar'
        aria-valuenow={workshop.bookedSeats}
        aria-valuemin={0}
        aria-valuemax={workshop.capacity}
        aria-label='Chỗ đã đặt'
      >
        <div
          className={cn('h-full rounded-full', workshop.seatsLeft === 0 ? 'bg-warning' : 'bg-teal')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
