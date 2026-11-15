import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Clock, MapPin, RotateCw, SearchX, UserRound, UsersRound } from 'lucide-react'
import { formatDate, formatTimeRange } from '@lib/utils'
import { ProductGallery } from '@components/product'
import { useAuthStore } from '@stores/authStore'
import { RegistrationCard } from './components/RegistrationCard'
import { useWorkshopDetailStore } from './store'

function DetailSkeleton() {
  return (
    <div className='grid gap-10 lg:grid-cols-[1fr_24rem]' aria-busy='true' aria-label='Đang tải lớp workshop'>
      <div className='space-y-4'>
        <div className='aspect-[4/3] animate-pulse rounded-[var(--radius-organic)] bg-cream' />
        <div className='h-10 w-3/4 animate-pulse rounded bg-cream' />
        <div className='h-24 w-full animate-pulse rounded bg-cream' />
      </div>
      <div className='h-80 animate-pulse rounded-[var(--radius-organic)] bg-cream' />
    </div>
  )
}

// US-12: Xem chi tiết và đăng ký lớp workshop
export default function WorkshopDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { workshop, loading, notFound, error, load, reset } = useWorkshopDetailStore()
  // Đăng nhập xong form mới điền sẵn được tên, số điện thoại
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    load(slug)
    window.scrollTo({ top: 0 })
  }, [slug, load])

  useEffect(() => reset, [reset])

  if (notFound) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center'>
        <SearchX size={44} className='text-sage' aria-hidden />
        <h1 className='font-display text-3xl font-bold text-moss'>Không tìm thấy lớp workshop</h1>
        <p className='text-ink'>Lớp có thể đã kết thúc, bị huỷ hoặc đường dẫn không đúng.</p>
        <Link to='/workshops' className='btn-primary mt-4'>
          Xem lịch workshop
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center'>
        <p className='font-semibold text-danger'>{error}</p>
        <button type='button' onClick={() => load(slug)} className='btn-outline'>
          <RotateCw size={16} />
          Thử lại
        </button>
      </div>
    )
  }

  const facts = workshop
    ? [
        { icon: CalendarDays, label: 'Ngày học', value: formatDate(workshop.startsAt) },
        { icon: Clock, label: 'Thời gian', value: formatTimeRange(workshop.startsAt, workshop.endsAt) },
        { icon: MapPin, label: 'Địa điểm', value: workshop.location },
        { icon: UserRound, label: 'Hướng dẫn', value: workshop.instructor },
        { icon: UsersRound, label: 'Sĩ số', value: `${workshop.capacity} người` }
      ].filter((fact) => fact.value)
    : []

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12'>
      {loading || !workshop ? (
        <DetailSkeleton />
      ) : (
        <>
          <nav aria-label='Đường dẫn' className='mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted'>
            <Link to='/' className='hover:text-teal'>
              Trang chủ
            </Link>
            <ChevronRight size={14} aria-hidden />
            <Link to='/workshops' className='hover:text-teal'>
              Workshop
            </Link>
            <ChevronRight size={14} aria-hidden />
            <span className='line-clamp-1 font-semibold text-forest'>{workshop.name}</span>
          </nav>

          <div className='grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start'>
            <div className='min-w-0'>
              <p className='text-sm font-bold tracking-[0.15em] text-leaf uppercase'>Workshop trải nghiệm</p>
              <h1 className='mt-2 font-display text-4xl leading-tight font-bold text-moss sm:text-5xl'>
                {workshop.name}
              </h1>

              <dl className='mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2'>
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className='flex items-start gap-3'>
                    <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss/10 text-moss'>
                      <Icon size={17} aria-hidden />
                    </span>
                    <div className='min-w-0'>
                      <dt className='text-xs text-muted'>{label}</dt>
                      <dd className='font-semibold text-forest'>{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className='mt-8'>
                <ProductGallery
                  key={workshop.id}
                  name={workshop.name}
                  imageUrls={workshop.imageUrls}
                  aspectClass='aspect-[4/3]'
                />
              </div>

              {workshop.description && (
                <section className='mt-8'>
                  <h2 className='text-lg font-bold text-moss'>Giới thiệu lớp học</h2>
                  <p className='mt-2 leading-relaxed whitespace-pre-line text-ink'>{workshop.description}</p>
                </section>
              )}
            </div>

            <RegistrationCard key={`${workshop.id}-${userId}`} workshop={workshop} />
          </div>
        </>
      )}
    </div>
  )
}
