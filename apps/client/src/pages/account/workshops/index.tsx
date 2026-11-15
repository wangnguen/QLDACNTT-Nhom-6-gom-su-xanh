import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarHeart, RotateCw } from 'lucide-react'
import type { MyRegistrationQuery, RegistrationStatus } from '@lib/api'
import { cn } from '@lib/utils'
import { Pagination } from '@components/Pagination'
import { SectionHeader } from '../components'
import { RegistrationItem } from './components/RegistrationItem'
import { useMyWorkshopsStore } from './store'

const PAGE_SIZE = 5

const TABS: { value: '' | RegistrationStatus; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'attended', label: 'Đã tham gia' },
  { value: 'cancelled', label: 'Đã huỷ' }
]

// US-13: Lịch workshop của tôi — xem các lớp đã đăng ký và tự huỷ
export default function MyWorkshopsPage() {
  const { result, loading, error, cancellingId, fetch, cancel } = useMyWorkshopsStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const status = (searchParams.get('status') ?? '') as '' | RegistrationStatus
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const query = useMemo<MyRegistrationQuery>(
    () => ({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, status: status || undefined }),
    [page, status]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  const changeParams = (next: Record<string, string>) =>
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)), { replace: true })

  return (
    <>
      <SectionHeader
        title='Lịch workshop của tôi'
        description='Các lớp bạn đã đăng ký. Tự huỷ được tới trước giờ học 24 tiếng.'
      />

      <div
        role='tablist'
        aria-label='Lọc theo trạng thái'
        className='-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]'
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type='button'
            role='tab'
            aria-selected={status === tab.value}
            onClick={() => changeParams({ status: tab.value })}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
              status === tab.value ? 'bg-moss text-cream' : 'border border-clay text-moss hover:border-moss/40'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className='flex flex-col items-center gap-3 py-12 text-center'>
          <p className='font-semibold text-danger'>{error}</p>
          <button type='button' onClick={() => fetch(query)} className='btn-outline'>
            <RotateCw size={16} />
            Thử lại
          </button>
        </div>
      ) : !result ? (
        <div className='space-y-4 py-5' aria-busy='true' aria-label='Đang tải lịch workshop'>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className='h-28 animate-pulse rounded-2xl bg-sand' />
          ))}
        </div>
      ) : result.entries.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-12 text-center'>
          <CalendarHeart size={40} className='text-sage' aria-hidden />
          <p className='font-display text-2xl font-bold text-moss'>
            {status ? 'Không có đăng ký nào ở trạng thái này' : 'Bạn chưa đăng ký lớp nào'}
          </p>
          <Link to='/workshops' className='btn-primary mt-2'>
            Xem lịch workshop
          </Link>
        </div>
      ) : (
        <>
          <ul className={cn('divide-y divide-clay/50 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            {result.entries.map((registration) => (
              <RegistrationItem
                key={registration.id}
                registration={registration}
                cancelling={cancellingId === registration.id}
                onCancel={(reason) => cancel(registration, reason)}
              />
            ))}
          </ul>
          <div className='mt-6'>
            <Pagination
              page={page}
              pageCount={Math.ceil(result.total_count / PAGE_SIZE)}
              onChange={(next) => changeParams({ status, page: next > 1 ? String(next) : '' })}
            />
          </div>
        </>
      )}
    </>
  )
}
