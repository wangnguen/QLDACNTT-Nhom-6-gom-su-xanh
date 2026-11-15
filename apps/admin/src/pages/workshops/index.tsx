import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { CalendarX2, Pencil, Plus, RotateCw, Search, Trash2, X } from 'lucide-react'
import type { AdminWorkshopQuery, WorkshopSort, WorkshopStatus, WorkshopSummary, WorkshopTime } from '@lib/api'
import { cn, formatDate, formatPrice, formatTimeRange } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { ConfirmDialog, FilterSelect, PageHeader, Pagination, Switch, Thumbnail } from '@components/ui'
import { SeatsCell } from './components/SeatsCell'
import { useWorkshopsStore } from './store'

const PAGE_SIZE = 10

// Mặc định chỉ xem lớp chưa kết thúc; 'all' = bỏ bộ lọc thời gian
const TIME_OPTIONS: { value: WorkshopTime | 'all'; label: string }[] = [
  { value: 'upcoming', label: 'Chưa kết thúc' },
  { value: 'past', label: 'Đã kết thúc' },
  { value: 'all', label: 'Mọi thời gian' }
]

const STATUS_OPTIONS: { value: '' | WorkshopStatus; label: string }[] = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'active', label: 'Đang mở' },
  { value: 'hidden', label: 'Đang ẩn' }
]

const SORT_OPTIONS: { value: WorkshopSort; label: string }[] = [
  { value: 'start_asc', label: 'Lịch gần nhất' },
  { value: 'start_desc', label: 'Lịch xa nhất' },
  { value: 'newest', label: 'Mới tạo' },
  { value: 'price_asc', label: 'Học phí tăng dần' },
  { value: 'price_desc', label: 'Học phí giảm dần' }
]

// US-11: Quản lý lớp workshop — bộ lọc lưu trên URL để quay lại từ trang sửa vẫn giữ nguyên
export default function WorkshopsPage() {
  const { result, loading, loadError, deleting, fetch, toggleActive, remove } = useWorkshopsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const [deletingWorkshop, setDeletingWorkshop] = useState<WorkshopSummary | null>(null)

  const search = searchParams.get('search') ?? ''
  const time = (searchParams.get('time') ?? 'upcoming') as WorkshopTime | 'all'
  const status = (searchParams.get('status') ?? '') as '' | WorkshopStatus
  const sort = (searchParams.get('sort') ?? 'start_asc') as WorkshopSort
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput.trim())

  const updateParams = useCallback(
    (changes: Record<string, string>, resetPage = true) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
          if (resetPage) next.delete('page')
          return next
        },
        { replace: true }
      ),
    [setSearchParams]
  )

  useEffect(() => {
    if (debouncedSearch !== search) updateParams({ search: debouncedSearch })
  }, [debouncedSearch, search, updateParams])

  const query = useMemo<AdminWorkshopQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      time: time === 'all' ? undefined : time,
      status: status || undefined,
      sort
    }),
    [page, search, time, status, sort]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  const hasFilter = !!(search || status || time !== 'upcoming')
  const entries = result?.entries ?? []

  const handleDelete = async () => {
    if (!deletingWorkshop || !(await remove(deletingWorkshop))) return
    setDeletingWorkshop(null)
    // Xoá lớp cuối cùng của trang → lùi về trang trước
    if (entries.length === 1 && page > 1) updateParams({ page: String(page - 1) }, false)
    else fetch(query)
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Lớp workshop'
        description='Lên lịch, mở hoặc ẩn các lớp trải nghiệm làm gốm.'
        actions={
          <Link to='/workshops/new' state={{ from: location.search }} className='btn-primary px-5 py-2.5 text-sm'>
            <Plus size={18} />
            Thêm lớp
          </Link>
        }
      />

      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-3 lg:grid-cols-[1fr_11rem_11rem_11rem]'>
          <div className='relative sm:col-span-3 lg:col-span-1'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Tìm theo tên lớp...'
              aria-label='Tìm lớp'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          <FilterSelect
            label='Lọc theo thời gian'
            value={time}
            onChange={(value) => updateParams({ time: value === 'upcoming' ? '' : value })}
            options={TIME_OPTIONS}
          />
          <FilterSelect
            label='Lọc theo trạng thái'
            value={status}
            onChange={(value) => updateParams({ status: value })}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label='Sắp xếp'
            value={sort}
            onChange={(value) => updateParams({ sort: value === 'start_asc' ? '' : value })}
            options={SORT_OPTIONS}
          />
        </div>

        {loadError ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <p className='font-semibold text-danger'>{loadError}</p>
            <button type='button' onClick={() => fetch(query)} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          </div>
        ) : !result ? (
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải danh sách lớp'>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <CalendarX2 size={40} className='text-sage' aria-hidden />
            {hasFilter ? (
              <>
                <p className='font-semibold'>Không có lớp nào khớp bộ lọc</p>
                <button
                  type='button'
                  onClick={() => {
                    setSearchInput('')
                    updateParams({ search: '', status: '', time: '' })
                  }}
                  className='btn-outline'
                >
                  <X size={16} />
                  Xoá bộ lọc
                </button>
              </>
            ) : (
              <>
                <p className='font-semibold'>Chưa có lớp nào sắp diễn ra</p>
                <Link to='/workshops/new' className='btn-primary mt-2 px-5 py-2.5 text-sm'>
                  <Plus size={18} />
                  Lên lịch lớp mới
                </Link>
              </>
            )}
          </div>
        ) : (
          <div
            className={cn('relative overflow-x-auto transition-opacity', loading && 'opacity-60')}
            aria-busy={loading}
          >
            <table className='w-full min-w-[52rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Lớp
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Lịch học
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Chỗ đã đặt
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Học phí
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Đang mở
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    <span className='sr-only'>Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {entries.map((workshop) => (
                  <tr key={workshop.id} className='transition-colors hover:bg-sand/40'>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-3'>
                        <Thumbnail src={workshop.imageUrl} alt='' />
                        <div className='min-w-0'>
                          <Link
                            to={`/workshops/${workshop.id}/edit`}
                            state={{ from: location.search }}
                            className='line-clamp-2 font-semibold text-forest hover:text-teal'
                          >
                            {workshop.name}
                          </Link>
                          <p className='truncate text-xs text-muted'>{workshop.instructor ?? workshop.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-5 py-3 whitespace-nowrap'>
                      <p className='font-semibold text-forest'>{formatDate(workshop.startsAt)}</p>
                      <p className='text-xs text-muted'>{formatTimeRange(workshop.startsAt, workshop.endsAt)}</p>
                    </td>
                    <td className='px-5 py-3'>
                      <SeatsCell workshop={workshop} />
                    </td>
                    <td className='px-5 py-3 text-right font-semibold whitespace-nowrap'>
                      {workshop.price > 0 ? formatPrice(workshop.price) : 'Miễn phí'}
                    </td>
                    <td className='px-5 py-3'>
                      <Switch
                        checked={workshop.isActive}
                        onChange={() => toggleActive(workshop)}
                        label={`Mở ${workshop.name}`}
                      />
                    </td>
                    <td className='px-5 py-3'>
                      <div className='flex justify-end gap-1'>
                        <Link
                          to={`/workshops/${workshop.id}/edit`}
                          state={{ from: location.search }}
                          className='inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-moss/5 hover:text-moss'
                          aria-label={`Sửa ${workshop.name}`}
                          title='Sửa'
                        >
                          <Pencil size={17} />
                        </Link>
                        <button
                          type='button'
                          onClick={() => setDeletingWorkshop(workshop)}
                          className='inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/5 hover:text-danger'
                          aria-label={`Xoá ${workshop.name}`}
                          title='Xoá'
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && result.total_count > 0 && (
          <div className='border-t border-clay/60 px-5 py-4'>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={result.total_count}
              onChange={(next) => updateParams({ page: next > 1 ? String(next) : '' }, false)}
            />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deletingWorkshop}
        title='Xoá lớp workshop?'
        message={
          deletingWorkshop &&
          (deletingWorkshop.bookedSeats > 0 ? (
            <>
              <strong className='text-forest'>{deletingWorkshop.name}</strong> đã có người đăng ký nên không xoá được.
              Hãy tắt <strong className='text-forest'>Đang mở</strong> để ẩn lớp khỏi trang khách hàng.
            </>
          ) : (
            <>
              <strong className='text-forest'>{deletingWorkshop.name}</strong> sẽ bị gỡ khỏi lịch workshop. Không thể
              hoàn tác.
            </>
          ))
        }
        disabled={!!deletingWorkshop && deletingWorkshop.bookedSeats > 0}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingWorkshop(null)}
      />
    </div>
  )
}
