import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, ReceiptText, RotateCw, Search, X } from 'lucide-react'
import type { AdminOrderQuery, OrderStatus, PaymentMethod, PaymentStatus } from '@lib/api'
import { cn, formatDateTime, formatPrice } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { FilterSelect, PageHeader, Pagination, Thumbnail } from '@components/ui'
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, statusBadge } from '@components/order'
import { useOrdersStore } from './store'

const PAGE_SIZE = 10

const STATUS_TABS: ('' | OrderStatus)[] = ['', 'pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'returned']

const PAYMENT_STATUS_OPTIONS: { value: '' | PaymentStatus; label: string }[] = [
  { value: '', label: 'Mọi thanh toán' },
  ...(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((value) => ({ value, label: PAYMENT_STATUS[value].label }))
]

const PAYMENT_METHOD_OPTIONS: { value: '' | PaymentMethod; label: string }[] = [
  { value: '', label: 'Mọi phương thức' },
  { value: 'cod', label: 'Thanh toán khi nhận hàng' },
  { value: 'vnpay', label: 'VNPay' }
]

const dateInput =
  'w-full rounded-xl border border-clay bg-cream px-3.5 py-2.5 text-sm text-forest outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15'

// US-18: Quản lý đơn hàng — tab trạng thái có số đếm, tìm kiếm và bộ lọc lưu trên URL
export default function OrdersPage() {
  const { result, counts, loading, loadError, fetch, fetchCounts } = useOrdersStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const status = (searchParams.get('status') ?? '') as '' | OrderStatus
  const paymentStatus = (searchParams.get('paymentStatus') ?? '') as '' | PaymentStatus
  const paymentMethod = (searchParams.get('paymentMethod') ?? '') as '' | PaymentMethod
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
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

  const query = useMemo<AdminOrderQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      paymentMethod: paymentMethod || undefined,
      // Khoảng ngày ngược thì bỏ qua thay vì báo lỗi
      from: from && (!to || from <= to) ? from : undefined,
      to: to && (!from || from <= to) ? to : undefined
    }),
    [page, search, status, paymentStatus, paymentMethod, from, to]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  const hasFilter = !!(search || paymentStatus || paymentMethod || from || to)
  const entries = result?.entries ?? []
  const totalCount = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : null

  const clearFilters = () => {
    setSearchInput('')
    updateParams({ search: '', paymentStatus: '', paymentMethod: '', from: '', to: '' })
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Đơn hàng'
        description='Xác nhận đơn mới, theo dõi thanh toán và huỷ đơn khi cần.'
        actions={
          <button
            type='button'
            onClick={() => {
              fetch(query)
              fetchCounts()
            }}
            className='btn-outline'
          >
            <RotateCw size={16} />
            Tải lại
          </button>
        }
      />

      <div
        role='tablist'
        aria-label='Lọc theo trạng thái'
        className='-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]'
      >
        {STATUS_TABS.map((value) => {
          const count = value ? counts?.[value] : totalCount
          return (
            <button
              key={value}
              type='button'
              role='tab'
              aria-selected={status === value}
              onClick={() => updateParams({ status: value })}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                status === value ? 'bg-moss text-cream' : 'border border-clay bg-cream text-moss hover:border-moss/40'
              )}
            >
              {value ? ORDER_STATUS[value].label : 'Tất cả'}
              {count !== undefined && count !== null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs',
                    status === value
                      ? 'bg-cream/20'
                      : value === 'pending' && count > 0
                        ? 'bg-warning text-cream'
                        : 'bg-sand'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_13rem_12rem_9.5rem_9.5rem]'>
          <div className='relative sm:col-span-2 lg:col-span-1'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Mã đơn, tên, số điện thoại, email...'
              aria-label='Tìm đơn hàng'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          <FilterSelect
            label='Lọc theo tình trạng thanh toán'
            value={paymentStatus}
            onChange={(value) => updateParams({ paymentStatus: value })}
            options={PAYMENT_STATUS_OPTIONS}
          />
          <FilterSelect
            label='Lọc theo phương thức thanh toán'
            value={paymentMethod}
            onChange={(value) => updateParams({ paymentMethod: value })}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <input
            type='date'
            value={from}
            max={to || undefined}
            onChange={(e) => updateParams({ from: e.target.value })}
            aria-label='Đặt từ ngày'
            className={dateInput}
          />
          <input
            type='date'
            value={to}
            min={from || undefined}
            onChange={(e) => updateParams({ to: e.target.value })}
            aria-label='Đặt đến ngày'
            className={dateInput}
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
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải danh sách đơn hàng'>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <ReceiptText size={40} className='text-sage' aria-hidden />
            <p className='font-semibold'>
              {hasFilter || status ? 'Không có đơn hàng nào khớp bộ lọc' : 'Chưa có đơn hàng nào'}
            </p>
            {hasFilter && (
              <button type='button' onClick={clearFilters} className='btn-outline'>
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
            <table className='w-full min-w-[58rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider whitespace-nowrap text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Đơn hàng
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Khách
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Sản phẩm
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Tổng tiền
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Trạng thái
                  </th>
                  <th scope='col' className='px-3 py-3'>
                    <span className='sr-only'>Xem</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {entries.map((order) => {
                  const orderStatus = ORDER_STATUS[order.status]
                  const payment = PAYMENT_STATUS[order.paymentStatus]
                  return (
                    <tr key={order.id} className='align-top transition-colors hover:bg-sand/40'>
                      <td className='px-5 py-3'>
                        <Link
                          to={`/orders/${order.id}`}
                          className='font-mono text-xs font-bold tracking-wider text-teal hover:underline'
                        >
                          {order.code}
                        </Link>
                        <p className='mt-0.5 text-xs whitespace-nowrap text-muted'>{formatDateTime(order.placedAt)}</p>
                      </td>
                      <td className='px-5 py-3'>
                        <p className='font-semibold text-forest'>{order.recipientName}</p>
                        <p className='text-xs text-muted'>
                          {order.recipientPhone} · {order.customer.email}
                        </p>
                      </td>
                      <td className='px-5 py-3'>
                        <div className='flex items-center gap-2'>
                          <div className='flex -space-x-2'>
                            {order.items.slice(0, 3).map((item) => (
                              <Thumbnail
                                key={item.id}
                                src={item.imageUrl}
                                alt={item.productName}
                                className='h-10 w-10 border-2 border-cream'
                              />
                            ))}
                          </div>
                          <span className='text-xs text-muted'>{order.itemCount} sản phẩm</span>
                        </div>
                      </td>
                      <td className='px-5 py-3 text-right'>
                        <p className='font-semibold whitespace-nowrap'>{formatPrice(order.total)}</p>
                        <p className='text-xs whitespace-nowrap'>
                          <span className='text-muted'>{PAYMENT_METHOD[order.paymentMethod]} · </span>
                          <span className={cn('font-semibold', payment.className)}>{payment.label}</span>
                        </p>
                      </td>
                      <td className='px-5 py-3'>
                        <span className={cn(statusBadge, orderStatus.className)}>{orderStatus.label}</span>
                      </td>
                      <td className='px-3 py-3'>
                        <Link
                          to={`/orders/${order.id}`}
                          aria-label={`Xem đơn ${order.code}`}
                          className='inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-moss/5 hover:text-moss'
                        >
                          <ChevronRight size={18} />
                        </Link>
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
    </div>
  )
}
