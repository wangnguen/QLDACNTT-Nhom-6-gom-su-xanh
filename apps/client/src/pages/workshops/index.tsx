import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarX2, ChevronDown, ChevronRight, RotateCw, Search, X } from 'lucide-react'
import type { WorkshopQuery, WorkshopSort } from '@lib/api'
import { cn, toVnDate } from '@lib/utils'
import { Pagination } from '@components/Pagination'
import { WorkshopCard, WorkshopCardSkeleton } from '@components/workshop'
import { useWorkshopsStore } from './store'

const PAGE_SIZE = 9

const SORT_OPTIONS: { value: WorkshopSort; label: string }[] = [
  { value: 'start_asc', label: 'Lịch gần nhất' },
  { value: 'price_asc', label: 'Học phí thấp đến cao' },
  { value: 'price_desc', label: 'Học phí cao đến thấp' },
  { value: 'newest', label: 'Mới mở' }
]

type Period = '' | 'week' | 'month' | 'next-month'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'week', label: '7 ngày tới' },
  { value: 'month', label: 'Tháng này' },
  { value: 'next-month', label: 'Tháng sau' }
]

// Ngày cuối của tháng chứa `date` (YYYY-MM-DD)
const endOfMonth = (date: string) => {
  const [year, month] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

// Khoảng ngày (giờ Việt Nam) gửi lên server
const periodRange = (period: Period): Pick<WorkshopQuery, 'from' | 'to'> => {
  const today = toVnDate()
  if (period === 'week') return { from: today, to: toVnDate(new Date(), 6) }
  if (period === 'month') return { from: today, to: endOfMonth(today) }
  if (period === 'next-month') {
    const firstOfNext = toVnDate(new Date(`${endOfMonth(today)}T12:00:00Z`), 1)
    return { from: firstOfNext, to: endOfMonth(firstOfNext) }
  }
  return {}
}

const chipClass = (active: boolean) =>
  cn(
    'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
    active ? 'bg-moss text-cream' : 'border border-clay bg-cream text-moss hover:border-moss/40'
  )

// US-12: Xem danh sách lớp workshop — bộ lọc nằm trên URL để chia sẻ link và bấm Back vẫn giữ nguyên
export default function WorkshopsPage() {
  const { result, loading, error, fetch } = useWorkshopsStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const period = (searchParams.get('period') ?? '') as Period
  const availableOnly = searchParams.get('available') === '1'
  const sort = (searchParams.get('sort') ?? 'start_asc') as WorkshopSort
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const searchTimer = useRef<number | undefined>(undefined)

  // URL đổi từ bên ngoài (bấm link Workshop, nút Back) → cập nhật lại ô tìm kiếm
  const [syncedSearch, setSyncedSearch] = useState(search)
  if (search !== syncedSearch) {
    setSyncedSearch(search)
    if (search !== searchInput.trim()) setSearchInput(search)
  }

  const updateParams = useCallback(
    (changes: Record<string, string>, { resetPage = true, replace = false } = {}) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
          if (resetPage) next.delete('page')
          return next
        },
        { replace }
      ),
    [setSearchParams]
  )

  // Gõ xong 350ms mới tìm, không gọi API theo từng phím
  const changeSearch = (value: string) => {
    setSearchInput(value)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => updateParams({ search: value.trim() }, { replace: true }), 350)
  }

  useEffect(() => () => window.clearTimeout(searchTimer.current), [])

  const query = useMemo<WorkshopQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      availableOnly: availableOnly || undefined,
      sort,
      ...periodRange(period)
    }),
    [page, search, availableOnly, sort, period]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  const hasFilter = !!(search || period || availableOnly)
  const total = result?.total_count ?? 0

  const clearFilters = () => {
    window.clearTimeout(searchTimer.current)
    setSearchInput('')
    setSearchParams(sort === 'start_asc' ? {} : { sort })
  }

  const changePage = (next: number) => {
    updateParams({ page: next > 1 ? String(next) : '' }, { resetPage: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12'>
      <nav aria-label='Đường dẫn' className='mb-4 flex items-center gap-1.5 text-sm text-muted'>
        <Link to='/' className='hover:text-teal'>
          Trang chủ
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className='font-semibold text-forest'>Workshop</span>
      </nav>

      <header className='mb-8'>
        <h1 className='font-display text-4xl font-bold text-moss sm:text-5xl'>Workshop làm gốm</h1>
        <p className='mt-2 max-w-2xl text-ink'>
          Tự tay nhào đất, vuốt gốm trên bàn xoay và vẽ men cùng nghệ nhân Bát Tràng. Chọn một buổi phù hợp và giữ chỗ
          ngay hôm nay.
        </p>
      </header>

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search size={18} className='pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted' />
          <input
            type='search'
            value={searchInput}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder='Tìm lớp vuốt gốm, vẽ men...'
            aria-label='Tìm lớp workshop'
            className='w-full rounded-full border border-clay bg-cream py-3 pr-4 pl-11 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
          />
        </div>
        <div className='relative sm:w-56'>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === 'start_asc' ? '' : e.target.value })}
            aria-label='Sắp xếp'
            className='w-full appearance-none rounded-full border border-clay bg-cream py-2.5 pr-10 pl-4 text-sm font-semibold text-moss outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15'
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted'
            aria-hidden
          />
        </div>
      </div>

      <div className='mb-6 flex flex-wrap items-center gap-2'>
        <div
          role='group'
          aria-label='Thời gian'
          className='-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]'
        >
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type='button'
              aria-pressed={period === option.value}
              onClick={() => updateParams({ period: option.value })}
              className={chipClass(period === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className='ml-auto flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-forest'>
          <input
            type='checkbox'
            checked={availableOnly}
            onChange={(e) => updateParams({ available: e.target.checked ? '1' : '' })}
            className='h-5 w-5 rounded border-clay accent-teal'
          />
          Chỉ lớp còn nhận đăng ký
        </label>
      </div>

      <div className='mb-4 flex min-h-8 flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted' aria-live='polite'>
          {result && !error && (
            <>
              <span className='font-semibold text-forest'>{total}</span> lớp sắp diễn ra
            </>
          )}
        </p>
        {hasFilter && (
          <button
            type='button'
            onClick={clearFilters}
            className='inline-flex items-center gap-1 text-sm font-semibold text-teal hover:text-teal-dark'
          >
            <X size={15} />
            Xoá bộ lọc
          </button>
        )}
      </div>

      {error ? (
        <div className='flex flex-col items-center gap-3 rounded-[var(--radius-organic)] border border-clay/70 bg-cream px-6 py-16 text-center'>
          <p className='font-semibold text-danger'>{error}</p>
          <button type='button' onClick={() => fetch(query)} className='btn-outline'>
            <RotateCw size={16} />
            Thử lại
          </button>
        </div>
      ) : !result ? (
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3' aria-busy='true' aria-label='Đang tải'>
          {Array.from({ length: 6 }, (_, i) => (
            <WorkshopCardSkeleton key={i} />
          ))}
        </div>
      ) : result.entries.length === 0 ? (
        <div className='flex flex-col items-center gap-3 rounded-[var(--radius-organic)] border border-clay/70 bg-cream px-6 py-16 text-center'>
          <CalendarX2 size={40} className='text-sage' aria-hidden />
          <p className='font-display text-2xl font-bold text-moss'>
            {hasFilter ? 'Không có lớp nào phù hợp' : 'Chưa có lịch workshop mới'}
          </p>
          <p className='max-w-sm text-ink'>
            {hasFilter ? 'Thử chọn khoảng thời gian khác hoặc bỏ bớt bộ lọc nhé.' : 'Lịch mới sẽ sớm được cập nhật.'}
          </p>
          {hasFilter && (
            <button type='button' onClick={clearFilters} className='btn-primary mt-2'>
              Xem tất cả lớp
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={cn('grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3', loading && 'opacity-60')}
            aria-busy={loading}
          >
            {result.entries.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
          <div className='mt-10'>
            <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} onChange={changePage} />
          </div>
        </>
      )}
    </div>
  )
}
