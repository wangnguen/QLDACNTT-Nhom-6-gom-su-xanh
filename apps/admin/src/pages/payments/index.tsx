import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BadgeCheck, CircleAlert, HandCoins, RotateCw, Search, Undo2, WalletCards, X } from 'lucide-react'
import type {
  AdminTransaction,
  AdminTransactionQuery,
  PaymentMethod,
  TransactionStatus,
  TransactionType
} from '@lib/api'
import { cn, formatDateTime, formatPrice } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { FilterSelect, PageHeader, Pagination } from '@components/ui'
import { PAYMENT_METHOD, TRANSACTION_STATUS, statusBadge } from '@components/order'
import { RefundDialog } from './components/RefundDialog'
import { usePaymentsStore } from './store'

const PAGE_SIZE = 15

const TYPE_OPTIONS: { value: '' | TransactionType; label: string }[] = [
  { value: '', label: 'Mọi loại' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'refund', label: 'Hoàn tiền' }
]

const STATUS_OPTIONS: { value: '' | TransactionStatus; label: string }[] = [
  { value: '', label: 'Mọi trạng thái' },
  ...(Object.keys(TRANSACTION_STATUS) as TransactionStatus[]).map((value) => ({
    value,
    label: TRANSACTION_STATUS[value].label
  }))
]

const METHOD_OPTIONS: { value: '' | PaymentMethod; label: string }[] = [
  { value: '', label: 'Mọi phương thức' },
  { value: 'vnpay', label: 'VNPay' },
  { value: 'cod', label: 'Tiền mặt (COD)' }
]

const dateInput =
  'w-full rounded-xl border border-clay bg-cream px-3.5 py-2.5 text-sm text-forest outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15'

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  onClick
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
  tone?: 'warning'
  onClick?: () => void
}) {
  const content = (
    <>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-teal/10 text-teal'
        )}
      >
        {icon}
      </span>
      <span className='min-w-0 text-left'>
        <span className='block text-xs font-bold tracking-wider text-muted uppercase'>{label}</span>
        <span className='mt-0.5 block font-display text-2xl font-bold text-forest'>{value}</span>
        <span className='block text-xs text-muted'>{hint}</span>
      </span>
    </>
  )
  const className = 'flex items-start gap-3 rounded-2xl border border-clay/70 bg-cream p-4 shadow-sm'
  return onClick ? (
    <button type='button' onClick={onClick} className={cn(className, 'transition-colors hover:border-warning/50')}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}

// US-20: Quản lý giao dịch thanh toán — tổng hợp theo khoảng ngày, danh sách mọi giao dịch, xác nhận hoàn tiền
export default function PaymentsPage() {
  const { result, summary, loading, loadError, refundingId, fetch, fetchSummary, completeRefund } = usePaymentsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [refunding, setRefunding] = useState<AdminTransaction | null>(null)

  const search = searchParams.get('search') ?? ''
  const type = (searchParams.get('type') ?? '') as '' | TransactionType
  const status = (searchParams.get('status') ?? '') as '' | TransactionStatus
  const method = (searchParams.get('method') ?? '') as '' | PaymentMethod
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

  // Khoảng ngày ngược thì bỏ qua thay vì báo lỗi
  const range = useMemo(() => {
    const valid = !from || !to || from <= to
    return { from: valid && from ? from : undefined, to: valid && to ? to : undefined }
  }, [from, to])

  const query = useMemo<AdminTransactionQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      type: type || undefined,
      status: status || undefined,
      method: method || undefined,
      ...range
    }),
    [page, search, type, status, method, range]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchSummary(range)
  }, [fetchSummary, range])

  const entries = result?.entries ?? []
  const hasFilter = !!(search || type || status || method || from || to)
  const rangeLabel = range.from || range.to ? 'trong khoảng ngày đã chọn' : 'mọi thời điểm'

  const handleRefund = async (referenceNo: string, note: string) => {
    if (refunding && (await completeRefund(refunding, referenceNo, note))) {
      setRefunding(null)
      fetchSummary(range)
    }
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Giao dịch'
        description='Các lượt thanh toán VNPay, tiền thu khi giao hàng (COD) và yêu cầu hoàn tiền.'
      />

      <div className='mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          icon={<HandCoins size={20} />}
          label='Đã nhận'
          value={summary ? formatPrice(summary.receivedAmount) : '—'}
          hint={summary ? `${summary.receivedCount} giao dịch, ${rangeLabel}` : rangeLabel}
        />
        <StatCard
          icon={<Undo2 size={20} />}
          label='Đã hoàn'
          value={summary ? formatPrice(summary.refundedAmount) : '—'}
          hint={summary ? `${summary.refundedCount} giao dịch, ${rangeLabel}` : rangeLabel}
        />
        <StatCard
          icon={<CircleAlert size={20} />}
          label='Chờ hoàn tiền'
          value={summary ? String(summary.pendingRefundCount) : '—'}
          hint={summary ? `${formatPrice(summary.pendingRefundAmount)} cần hoàn` : 'Bấm để xem'}
          tone='warning'
          onClick={() => updateParams({ type: 'refund', status: 'pending', from: '', to: '' })}
        />
        <StatCard
          icon={<X size={20} />}
          label='Thất bại'
          value={summary ? String(summary.failedCount) : '—'}
          hint={`Lượt thanh toán không thành công, ${rangeLabel}`}
        />
      </div>

      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_10rem_10rem]'>
          <div className='relative sm:col-span-2 lg:col-span-1'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Mã giao dịch, mã VNPay, mã đơn, email...'
              aria-label='Tìm giao dịch'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          <FilterSelect
            label='Loại giao dịch'
            value={type}
            onChange={(value) => updateParams({ type: value })}
            options={TYPE_OPTIONS}
          />
          <FilterSelect
            label='Trạng thái'
            value={status}
            onChange={(value) => updateParams({ status: value })}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label='Phương thức'
            value={method}
            onChange={(value) => updateParams({ method: value })}
            options={METHOD_OPTIONS}
          />
          <div className='flex items-center gap-2 sm:col-span-2 lg:col-span-4'>
            <span className='shrink-0 text-sm text-muted'>Từ ngày</span>
            <input
              type='date'
              value={from}
              max={to || undefined}
              onChange={(e) => updateParams({ from: e.target.value })}
              aria-label='Từ ngày'
              className={cn(dateInput, 'max-w-44')}
            />
            <span className='shrink-0 text-sm text-muted'>đến</span>
            <input
              type='date'
              value={to}
              min={from || undefined}
              onChange={(e) => updateParams({ to: e.target.value })}
              aria-label='Đến ngày'
              className={cn(dateInput, 'max-w-44')}
            />
            {hasFilter && (
              <button
                type='button'
                onClick={() => {
                  setSearchInput('')
                  updateParams({ search: '', type: '', status: '', method: '', from: '', to: '' })
                }}
                className='ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger'
              >
                <X size={16} />
                Xoá bộ lọc
              </button>
            )}
          </div>
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
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải danh sách giao dịch'>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className='h-14 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <WalletCards size={40} className='text-sage' aria-hidden />
            <p className='font-semibold'>
              {hasFilter ? 'Không có giao dịch nào khớp bộ lọc' : 'Chưa có giao dịch nào'}
            </p>
          </div>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            <table className='w-full min-w-[60rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider whitespace-nowrap text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Giao dịch
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Khách / đơn
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Số tiền
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Kết quả
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {entries.map((transaction) => {
                  const badge = TRANSACTION_STATUS[transaction.status]
                  const refund = transaction.type === 'refund'
                  return (
                    <tr key={transaction.id} className='align-top transition-colors hover:bg-sand/40'>
                      <td className='px-5 py-3'>
                        <p className='font-semibold text-forest'>
                          {refund ? 'Hoàn tiền' : 'Thanh toán'} · {PAYMENT_METHOD[transaction.method]}
                        </p>
                        <p className='font-mono text-xs text-teal'>{transaction.code}</p>
                        {transaction.gatewayTransactionNo && (
                          <p className='font-mono text-xs text-muted'>
                            Tham chiếu {transaction.gatewayTransactionNo}
                            {transaction.bankCode && ` · ${transaction.bankCode}`}
                          </p>
                        )}
                      </td>
                      <td className='px-5 py-3'>
                        <p className='font-semibold'>{transaction.customer.fullName}</p>
                        <p className='text-xs text-muted'>{transaction.customer.email}</p>
                        <Link
                          to={`/orders/${transaction.order.id}`}
                          className='font-mono text-xs font-bold tracking-wider text-teal hover:underline'
                        >
                          {transaction.order.code}
                        </Link>
                      </td>
                      <td
                        className={cn(
                          'px-5 py-3 text-right font-semibold whitespace-nowrap',
                          transaction.status === 'failed' && 'text-muted line-through',
                          refund && transaction.status !== 'failed' && 'text-danger'
                        )}
                      >
                        {refund ? '−' : '+'}
                        {formatPrice(transaction.amount)}
                      </td>
                      <td className='px-5 py-3'>
                        <span className={cn(statusBadge, badge.className)}>{badge.label}</span>
                        <p className='mt-1 max-w-60 text-xs text-ink'>{transaction.message}</p>
                        {transaction.note && transaction.note !== transaction.message && (
                          <p className='max-w-60 text-xs text-muted italic'>{transaction.note}</p>
                        )}
                        <p className='mt-0.5 text-xs whitespace-nowrap text-muted'>
                          {formatDateTime(transaction.completedAt ?? transaction.createdAt)}
                        </p>
                      </td>
                      <td className='px-5 py-3 text-right'>
                        {refund && transaction.status === 'pending' ? (
                          <button
                            type='button'
                            onClick={() => setRefunding(transaction)}
                            disabled={refundingId === transaction.id}
                            className='inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-bold whitespace-nowrap text-cream transition-colors hover:bg-teal-dark disabled:opacity-40'
                          >
                            <BadgeCheck size={14} />
                            Đã hoàn tiền
                          </button>
                        ) : (
                          <span className='text-xs text-muted'>—</span>
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

      <RefundDialog
        key={refunding?.id ?? 'closed'}
        transaction={refunding}
        loading={!!refunding && refundingId === refunding.id}
        onConfirm={handleRefund}
        onClose={() => setRefunding(null)}
      />
    </div>
  )
}
