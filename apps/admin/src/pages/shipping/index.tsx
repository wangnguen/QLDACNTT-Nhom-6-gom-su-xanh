import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LoaderCircle, PackageCheck, Pencil, RotateCw, Search, Truck, Undo2, X } from 'lucide-react'
import type { AdminOrder, AdminOrderQuery, OrderStatus, ShippingCarrier } from '@lib/api'
import { cn, formatDateTime, formatPrice } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { ConfirmDialog, FilterSelect, PageHeader, Pagination } from '@components/ui'
import { PAYMENT_METHOD, PAYMENT_STATUS, ReturnDialog, SHIPPING_CARRIER, ShipDialog } from '@components/order'
import { useShippingStore } from './store'

const PAGE_SIZE = 10

type ShippingTab = Extract<OrderStatus, 'confirmed' | 'shipping' | 'delivered' | 'returned'>

const TABS: { value: ShippingTab; label: string }[] = [
  { value: 'confirmed', label: 'Chờ giao' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'returned', label: 'Hoàn hàng' }
]

const CARRIER_OPTIONS: { value: '' | ShippingCarrier; label: string }[] = [
  { value: '', label: 'Mọi đơn vị vận chuyển' },
  ...(Object.keys(SHIPPING_CARRIER) as ShippingCarrier[]).map((value) => ({ value, label: SHIPPING_CARRIER[value] }))
]

const actionButton =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40'

type Dialog = { kind: 'ship' | 'update' | 'deliver' | 'return'; order: AdminOrder } | null

// US-19: Quản lý vận chuyển — đơn chờ giao, đang giao, đã giao, hoàn hàng; tab và bộ lọc lưu trên URL
export default function ShippingPage() {
  const { result, counts, loading, loadError, updatingId, fetch, fetchCounts, updateShipment } = useShippingStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialog, setDialog] = useState<Dialog>(null)

  const status = (searchParams.get('status') ?? 'confirmed') as ShippingTab
  const carrier = (searchParams.get('carrier') ?? '') as '' | ShippingCarrier
  const search = searchParams.get('search') ?? ''
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
      status,
      // Đơn chờ giao chưa có đơn vị vận chuyển
      shippingCarrier: status !== 'confirmed' && carrier ? carrier : undefined,
      search: search || undefined
    }),
    [page, status, carrier, search]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  const reload = () => fetch(query)
  const entries = result?.entries ?? []
  const busy = !!dialog && updatingId === dialog.order.id

  const closeAfter = async (done: Promise<boolean>) => {
    if (await done) setDialog(null)
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Vận chuyển'
        description='Giao đơn đã xác nhận cho đơn vị vận chuyển, cập nhật mã vận đơn và kết quả giao hàng.'
        actions={
          <Link to='/orders' className='btn-outline'>
            Tất cả đơn hàng
          </Link>
        }
      />

      <div role='tablist' aria-label='Trạng thái giao hàng' className='-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1'>
        {TABS.map((tab) => {
          const count = counts?.[tab.value]
          return (
            <button
              key={tab.value}
              type='button'
              role='tab'
              aria-selected={status === tab.value}
              onClick={() => updateParams({ status: tab.value === 'confirmed' ? '' : tab.value })}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                status === tab.value
                  ? 'bg-moss text-cream'
                  : 'border border-clay bg-cream text-moss hover:border-moss/40'
              )}
            >
              {tab.label}
              {count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs',
                    status === tab.value
                      ? 'bg-cream/20'
                      : tab.value === 'confirmed' && count > 0
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
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-[1fr_16rem]'>
          <div className='relative'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Mã đơn, mã vận đơn, tên, số điện thoại...'
              aria-label='Tìm đơn'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          {status !== 'confirmed' && (
            <FilterSelect
              label='Lọc theo đơn vị vận chuyển'
              value={carrier}
              onChange={(value) => updateParams({ carrier: value })}
              options={CARRIER_OPTIONS}
            />
          )}
        </div>

        {loadError ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <p className='font-semibold text-danger'>{loadError}</p>
            <button type='button' onClick={reload} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          </div>
        ) : !result ? (
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải danh sách'>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <Truck size={40} className='text-sage' aria-hidden />
            <p className='font-semibold'>
              {search || carrier
                ? 'Không có đơn nào khớp bộ lọc'
                : status === 'confirmed'
                  ? 'Không có đơn nào đang chờ giao'
                  : 'Chưa có đơn nào'}
            </p>
            {(search || carrier) && (
              <button
                type='button'
                onClick={() => {
                  setSearchInput('')
                  updateParams({ search: '', carrier: '' })
                }}
                className='btn-outline'
              >
                <X size={16} />
                Xoá bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            <table className='w-full min-w-[58rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider whitespace-nowrap text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Đơn hàng
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Giao tới
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Vận chuyển
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Thu hộ (COD)
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {entries.map((order) => {
                  const rowBusy = updatingId === order.id
                  const collect = order.paymentMethod === 'cod' && order.paymentStatus === 'unpaid'
                  return (
                    <tr key={order.id} className='align-top transition-colors hover:bg-sand/40'>
                      <td className='px-5 py-3'>
                        <Link
                          to={`/orders/${order.id}`}
                          className='font-mono text-xs font-bold tracking-wider text-teal hover:underline'
                        >
                          {order.code}
                        </Link>
                        <p className='mt-0.5 text-xs text-muted'>
                          {order.itemCount} sản phẩm · xác nhận{' '}
                          {order.confirmedAt ? formatDateTime(order.confirmedAt) : '—'}
                        </p>
                      </td>
                      <td className='px-5 py-3'>
                        <p className='font-semibold text-forest'>
                          {order.recipientName} · {order.recipientPhone}
                        </p>
                        <p className='max-w-72 text-xs text-ink'>{order.shippingAddress}</p>
                      </td>
                      <td className='px-5 py-3'>
                        {order.shippingCarrier ? (
                          <>
                            <p className='font-semibold'>{SHIPPING_CARRIER[order.shippingCarrier]}</p>
                            {order.trackingCode && <p className='font-mono text-xs text-teal'>{order.trackingCode}</p>}
                            <p className='text-xs text-muted'>
                              {order.deliveredAt
                                ? `Giao xong ${formatDateTime(order.deliveredAt)}`
                                : order.returnedAt
                                  ? `Hoàn ${formatDateTime(order.returnedAt)}`
                                  : order.shippedAt && `Gửi đi ${formatDateTime(order.shippedAt)}`}
                            </p>
                            {order.deliveryNote && (
                              <p className='mt-0.5 max-w-56 text-xs text-danger'>{order.deliveryNote}</p>
                            )}
                          </>
                        ) : (
                          <p className='text-xs text-muted'>Chưa giao cho đơn vị vận chuyển</p>
                        )}
                      </td>
                      <td className='px-5 py-3 text-right'>
                        <p className={cn('font-semibold whitespace-nowrap', !collect && 'text-muted')}>
                          {collect ? formatPrice(order.total) : 'Không thu'}
                        </p>
                        <p className={cn('text-xs', PAYMENT_STATUS[order.paymentStatus].className)}>
                          {PAYMENT_METHOD[order.paymentMethod]} · {PAYMENT_STATUS[order.paymentStatus].label}
                        </p>
                      </td>
                      <td className='px-5 py-3'>
                        <div className='flex flex-wrap justify-end gap-1.5'>
                          {rowBusy && <LoaderCircle size={18} className='mt-1 animate-spin text-muted' />}
                          {order.status === 'confirmed' && (
                            <button
                              type='button'
                              onClick={() => setDialog({ kind: 'ship', order })}
                              disabled={rowBusy}
                              className={cn(actionButton, 'bg-teal text-cream hover:bg-teal-dark')}
                            >
                              <Truck size={14} />
                              Giao hàng
                            </button>
                          )}
                          {order.status === 'shipping' && (
                            <>
                              <button
                                type='button'
                                onClick={() => setDialog({ kind: 'deliver', order })}
                                disabled={rowBusy}
                                className={cn(actionButton, 'bg-teal text-cream hover:bg-teal-dark')}
                              >
                                <PackageCheck size={14} />
                                Đã giao
                              </button>
                              <button
                                type='button'
                                onClick={() => setDialog({ kind: 'update', order })}
                                disabled={rowBusy}
                                className={cn(actionButton, 'border border-moss/30 text-moss hover:bg-moss/5')}
                              >
                                <Pencil size={14} />
                                Sửa
                              </button>
                              <button
                                type='button'
                                onClick={() => setDialog({ kind: 'return', order })}
                                disabled={rowBusy}
                                className={cn(actionButton, 'text-danger hover:bg-danger/5')}
                              >
                                <Undo2 size={14} />
                                Hoàn hàng
                              </button>
                            </>
                          )}
                          {(order.status === 'delivered' || order.status === 'returned') && (
                            <span className='text-xs text-muted'>—</span>
                          )}
                        </div>
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

      {(dialog?.kind === 'ship' || dialog?.kind === 'update') && (
        <ShipDialog
          key={dialog.order.id + dialog.kind}
          order={dialog.order}
          mode={dialog.kind}
          loading={busy}
          onConfirm={(shippingCarrier, trackingCode) =>
            closeAfter(
              updateShipment(
                dialog.order,
                { action: dialog.kind as 'ship' | 'update', shippingCarrier, trackingCode },
                reload
              )
            )
          }
          onClose={() => setDialog(null)}
        />
      )}
      <ReturnDialog
        key={dialog?.kind === 'return' ? dialog.order.id : 'closed'}
        order={dialog?.kind === 'return' ? dialog.order : null}
        loading={busy}
        onConfirm={(reason) => dialog && closeAfter(updateShipment(dialog.order, { action: 'return', reason }, reload))}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog?.kind === 'deliver'}
        title='Xác nhận đã giao hàng?'
        message={
          dialog && (
            <>
              Đơn <strong>{dialog.order.code}</strong> đã tới tay {dialog.order.recipientName}.
              {dialog.order.paymentMethod === 'cod' &&
                dialog.order.paymentStatus === 'unpaid' &&
                ` Ghi nhận đã thu ${formatPrice(dialog.order.total)} tiền mặt.`}
            </>
          )
        }
        confirmText='Đã giao'
        tone='primary'
        loading={busy}
        onConfirm={() => dialog && closeAfter(updateShipment(dialog.order, { action: 'deliver' }, reload))}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}
