import type { ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, CircleCheckBig, LogIn } from 'lucide-react'
import type { WorkshopDetail } from '@lib/api'
import { MAX_SEATS_PER_REGISTRATION, registrationSchema, type RegistrationInput } from '@lib/schemas/workshop'
import { cn, formatDateTime, formatPrice } from '@lib/utils'
import { QuantityStepper } from '@components/product'
import { REGISTRATION_STATUS_LABEL } from '@components/workshop'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { useAuthStore } from '@stores/authStore'
import { useWorkshopDetailStore } from '../store'

function Shell({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label='Đăng ký lớp'
      className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm lg:sticky lg:top-24'
    >
      {children}
    </section>
  )
}

function PriceHeader({ workshop }: { workshop: WorkshopDetail }) {
  return (
    <div className='mb-5 flex items-baseline justify-between gap-3 border-b border-clay/50 pb-4'>
      <p className='font-display text-3xl font-bold text-teal'>
        {workshop.price > 0 ? formatPrice(workshop.price) : 'Miễn phí'}
        {workshop.price > 0 && <span className='ml-1 font-sans text-sm font-normal text-muted'>/ người</span>}
      </p>
      <p className='text-sm font-semibold text-ink'>
        Còn {workshop.seatsLeft}/{workshop.capacity} chỗ
      </p>
    </div>
  )
}

// US-12: Đăng ký lớp — khách chưa đăng nhập được chuyển sang trang đăng nhập rồi quay lại
export function RegistrationCard({ workshop }: { workshop: WorkshopDetail }) {
  const { user, isAuthenticated } = useAuthStore()
  const { submitting, submitError, registration, myRegistration, register } = useWorkshopDetailStore()
  const location = useLocation()

  const maxSeats = Math.max(1, Math.min(MAX_SEATS_PER_REGISTRATION, workshop.seatsLeft))

  const {
    register: field,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { seats: 1, contactName: user?.fullName ?? '', contactPhone: user?.phone ?? '', note: '' }
  })
  const seats = useWatch({ control, name: 'seats' })

  // Vừa đăng ký xong, hoặc đã đăng ký lớp này từ trước (US-13)
  const booked = registration ?? myRegistration
  if (booked) {
    const status = REGISTRATION_STATUS_LABEL[booked.status]
    return (
      <Shell>
        <div className='flex flex-col items-center text-center'>
          <span className='flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal'>
            <CircleCheckBig size={30} aria-hidden />
          </span>
          <h2 className='mt-3 font-display text-2xl font-bold text-moss'>
            {registration ? 'Đăng ký thành công!' : 'Bạn đã đăng ký lớp này'}
          </h2>
          {booked.status === 'pending' && (
            <p className='mt-1 text-sm text-ink'>Cửa hàng sẽ gọi điện xác nhận trong thời gian sớm nhất.</p>
          )}
        </div>
        <dl className='mt-5 space-y-2.5 rounded-xl bg-sand/60 p-4 text-sm'>
          <div className='flex justify-between gap-3'>
            <dt className='text-muted'>Mã đăng ký</dt>
            <dd className='font-mono text-base font-bold tracking-wider text-forest'>{booked.code}</dd>
          </div>
          <div className='flex justify-between gap-3'>
            <dt className='text-muted'>Số chỗ</dt>
            <dd className='font-semibold'>{booked.seats}</dd>
          </div>
          <div className='flex justify-between gap-3'>
            <dt className='text-muted'>Tổng tiền</dt>
            <dd className='font-semibold'>{booked.totalPrice > 0 ? formatPrice(booked.totalPrice) : 'Miễn phí'}</dd>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <dt className='text-muted'>Trạng thái</dt>
            <dd className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', status.className)}>{status.text}</dd>
          </div>
        </dl>
        <p className='mt-4 text-xs text-muted'>
          Đọc mã đăng ký cho nhân viên khi tới lớp. Thanh toán học phí tại xưởng.
        </p>
        <Link to='/account/workshops' className='btn-outline mt-4 w-full'>
          <CalendarDays size={16} />
          Xem lịch workshop của tôi
        </Link>
      </Shell>
    )
  }

  if (workshop.availability !== 'open') {
    return (
      <Shell>
        <PriceHeader workshop={workshop} />
        <button type='button' disabled className='btn-primary w-full'>
          {workshop.availability === 'full' ? 'Lớp đã hết chỗ' : 'Đã hết hạn đăng ký'}
        </button>
        <p className='mt-3 text-center text-sm text-ink'>
          <Link to='/workshops' className='link'>
            Xem các lớp khác
          </Link>
        </p>
      </Shell>
    )
  }

  if (!isAuthenticated) {
    return (
      <Shell>
        <PriceHeader workshop={workshop} />
        <Link to='/login' state={{ from: location.pathname }} className='btn-primary w-full'>
          <LogIn size={18} />
          Đăng nhập để đăng ký
        </Link>
        <p className='mt-3 text-center text-sm text-ink'>
          Chưa có tài khoản?{' '}
          <Link to='/register' className='link'>
            Đăng ký tài khoản
          </Link>
        </p>
        <p className='mt-4 text-xs text-muted'>Nhận đăng ký tới {formatDateTime(workshop.registrationClosesAt)}.</p>
      </Shell>
    )
  }

  const onSubmit = (data: RegistrationInput) => register({ workshopId: workshop.id, ...data, note: data.note || null })

  return (
    <Shell>
      <PriceHeader workshop={workshop} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-4'>
        <ErrorBanner message={submitError} />

        <div>
          <p className='mb-1.5 text-sm font-semibold text-forest'>Số người tham gia</p>
          <div className='flex items-center justify-between gap-3'>
            <Controller
              control={control}
              name='seats'
              render={({ field: seatField }) => (
                <QuantityStepper
                  value={Math.min(seatField.value, maxSeats)}
                  max={maxSeats}
                  onChange={seatField.onChange}
                  disabled={submitting}
                  label='Số người tham gia'
                />
              )}
            />
            <span className='text-xs text-muted'>Tối đa {maxSeats} chỗ</span>
          </div>
        </div>

        <FieldInput
          id='contactName'
          label='Họ và tên'
          autoComplete='name'
          error={errors.contactName}
          registration={field('contactName')}
        />
        <FieldInput
          id='contactPhone'
          label='Số điện thoại'
          type='tel'
          autoComplete='tel'
          placeholder='0912345678'
          error={errors.contactPhone}
          registration={field('contactPhone')}
        />
        <FieldInput
          id='note'
          label='Ghi chú (không bắt buộc)'
          placeholder='VD: đi cùng một bé 8 tuổi'
          error={errors.note}
          registration={field('note')}
        />

        <div className='flex items-baseline justify-between gap-3 border-t border-clay/50 pt-4'>
          <span className='font-semibold text-forest'>Tổng tiền</span>
          <span className='font-display text-2xl font-bold text-teal'>
            {workshop.price > 0 ? formatPrice(workshop.price * Math.min(seats, maxSeats)) : 'Miễn phí'}
          </span>
        </div>

        <SubmitButton loading={submitting} loadingText='Đang đăng ký...'>
          Đăng ký giữ chỗ
        </SubmitButton>
        <p className='text-xs text-muted'>
          Nhận đăng ký tới {formatDateTime(workshop.registrationClosesAt)}. Thanh toán học phí tại xưởng.
        </p>
      </form>
    </Shell>
  )
}
