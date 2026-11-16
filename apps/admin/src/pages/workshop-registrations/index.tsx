import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCheck, ClipboardList, LoaderCircle, RotateCw, Search, UserCheck, X, XCircle } from 'lucide-react'
import type { AdminRegistrationQuery, RegistrationStatus, WorkshopRegistration } from '@lib/api'
import { cn, formatDate, formatDateTime, formatPrice, formatTimeRange } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { FilterSelect, PageHeader, Pagination } from '@components/ui'
import { CancelRegistrationDialog } from './components/CancelRegistrationDialog'
import { useRegistrationsStore } from './store'

const PAGE_SIZE = 10

// Cửa hàng check-in được từ 60 phút trước giờ học (khớp với server)
const CHECK_IN_OPENS_BEFORE_MS = 60 * 60 * 1000

const STATUS: Record<RegistrationStatus, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-teal/10 text-teal' },
  attended: { label: 'Đã tham gia', className: 'bg-moss/10 text-moss' },
  cancelled: { label: 'Đã huỷ', className: 'bg-clay/40 text-muted' }
}

const STATUS_OPTIONS: { value: '' | RegistrationStatus; label: string }[] = [
  { value: '', label: 'Mọi trạng thái' },
  ...(Object.keys(STATUS) as RegistrationStatus[]).map((value) => ({ value, label: STATUS[value].label }))
]

const actionButton =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40'

// US-13: Quản lý đăng ký workshop — bộ lọc lưu trên URL (mở từ trang lớp sẽ lọc sẵn theo lớp đó)
export default function WorkshopRegistrationsPage() {
  const { result, workshops, loading, loadError, updatingId, fetch, fetchWorkshops, updateStatus } =
    useRegistrationsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [cancelling, setCancelling] = useState<WorkshopRegistration | null>(null)

  const search = searchParams.get('search') ?? ''
  const workshopId = searchParams.get('workshopId') ?? ''
  const status = (searchParams.get('status') ?? '') as '' | RegistrationStatus
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

  const query = useMemo<AdminRegistrationQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      workshopId: workshopId || undefined,
      status: status || undefined
    }),
    [page, search, workshopId, status]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchWorkshops()
  }, [fetchWorkshops])

  const hasFilter = !!(search || workshopId || status)
  const entries = useMemo(() => result?.entries ?? [], [result])

  // Lớp đang lọc có thể không nằm trong 100 lớp đã tải — vẫn hiện tên lấy từ kết quả
  const workshopOptions = useMemo(() => {
    const options = workshops.map((w) => ({ value: w.id, label: `${w.name} · ${formatDate(w.startsAt)}` }))
    const current = entries.find((r) => r.workshop.id === workshopId)?.workshop
    if (workshopId && current && !options.some((o) => o.value === workshopId)) {
      options.unshift({ value: workshopId, label: `${current.name} · ${formatDate(current.startsAt)}` })
    }
    return [{ value: '', label: 'Mọi lớp' }, ...options]
  }, [workshops, entries, workshopId])

  const handleCancel = async (reason: string) => {
    if (cancelling && (await updateStatus(cancelling, 'cancelled', reason))) setCancelling(null)
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Đăng ký workshop'
        description='Xác nhận, check-in hoặc huỷ các lượt đăng ký lớp của khách.'
        actions={
          <Link to='/workshops' className='btn-outline'>
            Danh sách lớp
          </Link>
        }
      />

      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_18rem_12rem]'>
          <div className='relative sm:col-span-2 lg:col-span-1'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Mã đăng ký, tên, số điện thoại, email...'
              aria-label='Tìm đăng ký'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          <FilterSelect
            label='Lọc theo lớp'
            value={workshopId}
            onChange={(value) => updateParams({ workshopId: value })}
            options={workshopOptions}
          />
          <FilterSelect
            label='Lọc theo trạng thái'
            value={status}
            onChange={(value) => updateParams({ status: value })}
            options={STATUS_OPTIONS}
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
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải danh sách đăng ký'>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <ClipboardList size={40} className='text-sage' aria-hidden />
            <p className='font-semibold'>
              {hasFilter ? 'Không có đăng ký nào khớp bộ lọc' : 'Chưa có lượt đăng ký nào'}
            </p>
            {hasFilter && (
              <button
                type='button'
                onClick={() => {
                  setSearchInput('')
                  updateParams({ search: '', workshopId: '', status: '' })
                }}
                className='btn-outline'
              >
                <X size={16} />
                Xoá bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div
            className={cn('relative overflow-x-auto transition-opacity', loading && 'opacity-60')}
            aria-busy={loading}
          >
            <table className='w-full min-w-[60rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider whitespace-nowrap text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Khách
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Lớp
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Số chỗ
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Tổng tiền
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Trạng thái
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {entries.map((registration) => {
                  const { workshop } = registration
                  const statusInfo = STATUS[registration.status]
                  const active = registration.status === 'pending' || registration.status === 'confirmed'
                  const checkInOpen = new Date(workshop.startsAt).getTime() - CHECK_IN_OPENS_BEFORE_MS <= Date.now()
                  const busy = updatingId === registration.id
                  return (
                    <tr key={registration.id} className='align-top transition-colors hover:bg-sand/40'>
                      <td className='px-5 py-3'>
                        <p className='font-mono text-xs font-bold tracking-wider text-teal'>{registration.code}</p>
                        <p className='font-semibold text-forest'>{registration.contactName}</p>
                        <p className='text-xs text-muted'>
                          {registration.contactPhone} · {registration.contactEmail}
                        </p>
                        {registration.note && (
                          <p className='mt-1 max-w-64 text-xs text-ink italic'>“{registration.note}”</p>
                        )}
                      </td>
                      <td className='px-5 py-3'>
                        <button
                          type='button'
                          onClick={() => updateParams({ workshopId: workshop.id })}
                          className='line-clamp-2 max-w-64 text-left font-semibold text-forest hover:text-teal'
                          title='Lọc theo lớp này'
                        >
                          {workshop.name}
                        </button>
                        <p className='text-xs text-muted'>
                          {formatDate(workshop.startsAt)} · {formatTimeRange(workshop.startsAt, workshop.endsAt)}
                        </p>
                      </td>
                      <td className='px-5 py-3 text-right font-semibold'>{registration.seats}</td>
                      <td className='px-5 py-3 text-right font-semibold whitespace-nowrap'>
                        {registration.totalPrice > 0 ? formatPrice(registration.totalPrice) : 'Miễn phí'}
                      </td>
                      <td className='px-5 py-3'>
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
                            statusInfo.className
                          )}
                        >
                          {statusInfo.label}
                        </span>
                        <p className='mt-1 text-xs whitespace-nowrap text-muted'>
                          Đăng ký {formatDateTime(registration.registeredAt)}
                        </p>
                        {registration.status === 'cancelled' && (
                          <p className='mt-0.5 max-w-52 text-xs text-muted'>
                            {registration.cancelledBy === 'admin' ? 'Cửa hàng huỷ' : 'Khách tự huỷ'}
                            {registration.cancelReason && `: ${registration.cancelReason}`}
                          </p>
                        )}
                      </td>
                      <td className='px-5 py-3'>
                        {active ? (
                          <div className='flex flex-wrap justify-end gap-1.5'>
                            {busy && <LoaderCircle size={18} className='mt-1 animate-spin text-muted' />}
                            {registration.status === 'pending' && (
                              <button
                                type='button'
                                onClick={() => updateStatus(registration, 'confirmed')}
                                disabled={busy}
                                className={cn(actionButton, 'bg-teal text-cream hover:bg-teal-dark')}
                              >
                                <CheckCheck size={14} />
                                Xác nhận
                              </button>
                            )}
                            <button
                              type='button'
                              onClick={() => updateStatus(registration, 'attended')}
                              disabled={busy || !checkInOpen}
                              title={checkInOpen ? 'Khách đã tới lớp' : 'Mở check-in từ 60 phút trước giờ học'}
                              className={cn(actionButton, 'border border-moss/30 text-moss hover:bg-moss/5')}
                            >
                              <UserCheck size={14} />
                              Check-in
                            </button>
                            <button
                              type='button'
                              onClick={() => setCancelling(registration)}
                              disabled={busy}
                              className={cn(actionButton, 'text-danger hover:bg-danger/5')}
                            >
                              <XCircle size={14} />
                              Huỷ
                            </button>
                          </div>
                        ) : (
                          <p className='text-right text-xs text-muted'>—</p>
                        )}
                      </td>
                    </tr>
                  )
                })}
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

      <CancelRegistrationDialog
        key={cancelling?.id}
        registration={cancelling}
        loading={!!cancelling && updatingId === cancelling.id}
        onConfirm={handleCancel}
        onClose={() => setCancelling(null)}
      />
    </div>
  )
}
