import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, LoaderCircle, MapPin } from 'lucide-react'
import type { WorkshopRegistration } from '@lib/api'
import { cn, formatDate, formatDateTime, formatPrice, formatTimeRange } from '@lib/utils'
import { ProductImage } from '@components/product'
import { REGISTRATION_STATUS_LABEL } from '@components/workshop'

interface Props {
  registration: WorkshopRegistration
  cancelling: boolean
  onCancel: (reason: string) => Promise<boolean>
}

// Một đăng ký trong "Lịch workshop của tôi": thông tin lớp, mã, số chỗ, tổng tiền, trạng thái và nút tự huỷ
export function RegistrationItem({ registration, cancelling, onCancel }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const { workshop } = registration
  const status = REGISTRATION_STATUS_LABEL[registration.status]
  const active = registration.status === 'pending' || registration.status === 'confirmed'
  const ended = new Date(workshop.endsAt).getTime() <= Date.now()

  const handleCancel = async () => {
    if (await onCancel(reason)) setConfirming(false)
  }

  return (
    <li className='flex flex-col gap-4 py-5 sm:flex-row'>
      <Link
        to={`/workshops/${workshop.slug}`}
        className='aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl border border-clay/60 sm:w-36'
      >
        <ProductImage src={workshop.imageUrl} alt={workshop.name} className='h-full w-full' />
      </Link>

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <Link to={`/workshops/${workshop.slug}`} className='font-semibold text-forest hover:text-teal'>
            {workshop.name}
          </Link>
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-bold', status.className)}>
            {status.text}
          </span>
        </div>

        <ul className='mt-2 space-y-1 text-sm text-ink'>
          <li className='flex items-center gap-2'>
            <CalendarDays size={15} className='shrink-0 text-muted' aria-hidden />
            {formatDate(workshop.startsAt)}
          </li>
          <li className='flex items-center gap-2'>
            <Clock size={15} className='shrink-0 text-muted' aria-hidden />
            {formatTimeRange(workshop.startsAt, workshop.endsAt)}
          </li>
          <li className='flex items-center gap-2'>
            <MapPin size={15} className='shrink-0 text-muted' aria-hidden />
            <span className='truncate'>{workshop.location}</span>
          </li>
        </ul>

        <dl className='mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm'>
          <div className='flex gap-1.5'>
            <dt className='text-muted'>Mã:</dt>
            <dd className='font-mono font-bold tracking-wider text-forest'>{registration.code}</dd>
          </div>
          <div className='flex gap-1.5'>
            <dt className='text-muted'>Số chỗ:</dt>
            <dd className='font-semibold'>{registration.seats}</dd>
          </div>
          <div className='flex gap-1.5'>
            <dt className='text-muted'>Tổng tiền:</dt>
            <dd className='font-semibold'>
              {registration.totalPrice > 0 ? formatPrice(registration.totalPrice) : 'Miễn phí'}
            </dd>
          </div>
        </dl>

        {registration.status === 'cancelled' && (
          <p className='mt-3 rounded-xl bg-sand/70 p-3 text-sm text-ink'>
            {registration.cancelledBy === 'admin' ? 'Cửa hàng đã huỷ đăng ký này' : 'Bạn đã huỷ đăng ký này'}
            {registration.cancelledAt && ` lúc ${formatDateTime(registration.cancelledAt)}`}
            {registration.cancelReason && (
              <>
                . Lý do: <span className='font-semibold'>{registration.cancelReason}</span>
              </>
            )}
          </p>
        )}

        {active && !ended && (
          <div className='mt-3'>
            {registration.canCancel ? (
              confirming ? (
                <div className='space-y-2 rounded-xl border border-danger/20 bg-danger/5 p-3'>
                  <label htmlFor={`reason-${registration.id}`} className='block text-sm font-semibold text-forest'>
                    Huỷ đăng ký này? Lý do (không bắt buộc)
                  </label>
                  <input
                    id={`reason-${registration.id}`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={255}
                    placeholder='VD: bận việc đột xuất'
                    className='w-full rounded-xl border border-clay bg-cream px-3.5 py-2.5 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
                  />
                  <div className='flex flex-wrap justify-end gap-2'>
                    <button
                      type='button'
                      onClick={() => setConfirming(false)}
                      disabled={cancelling}
                      className='btn-outline'
                    >
                      Giữ lại
                    </button>
                    <button
                      type='button'
                      onClick={handleCancel}
                      disabled={cancelling}
                      className='inline-flex items-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-cream hover:bg-danger/90 disabled:opacity-60'
                    >
                      {cancelling && <LoaderCircle size={16} className='animate-spin' />}
                      Huỷ đăng ký
                    </button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-wrap items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => setConfirming(true)}
                    className='text-sm font-semibold text-danger hover:underline'
                  >
                    Huỷ đăng ký
                  </button>
                  <span className='text-xs text-muted'>
                    Tự huỷ được tới {formatDateTime(registration.cancellableUntil)}
                  </span>
                </div>
              )
            ) : (
              <p className='text-xs text-muted'>
                Đã quá hạn tự huỷ (trước giờ học 24 tiếng). Cần đổi lịch, vui lòng liên hệ cửa hàng.
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
