import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RotateCw, WalletCards } from 'lucide-react'
import type { MyTransactionQuery, TransactionStatus, TransactionType } from '@lib/api'
import { cn } from '@lib/utils'
import { Pagination } from '@components/Pagination'
import { TransactionItem } from '@components/order'
import { SectionHeader } from '../components'
import { useTransactionsStore } from './store'

const PAGE_SIZE = 10

const TYPE_TABS: { value: '' | TransactionType; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'refund', label: 'Hoàn tiền' }
]

const STATUS_OPTIONS: { value: '' | TransactionStatus; label: string }[] = [
  { value: '', label: 'Mọi kết quả' },
  { value: 'success', label: 'Thành công' },
  { value: 'pending', label: 'Đang xử lý' },
  { value: 'failed', label: 'Thất bại' }
]

// US-17: Lịch sử giao dịch — các lượt thanh toán (VNPay, COD) và hoàn tiền của tài khoản
export default function TransactionsPage() {
  const { result, loading, error, fetch } = useTransactionsStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const type = (searchParams.get('type') ?? '') as '' | TransactionType
  const status = (searchParams.get('status') ?? '') as '' | TransactionStatus
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const query = useMemo<MyTransactionQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      type: type || undefined,
      status: status || undefined
    }),
    [page, type, status]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  const changeParams = (next: Record<string, string>) =>
    setSearchParams(Object.fromEntries(Object.entries({ type, status, ...next }).filter(([, value]) => value)), {
      replace: true
    })

  return (
    <>
      <SectionHeader title='Lịch sử giao dịch' description='Các lượt thanh toán và hoàn tiền cho đơn hàng của bạn.' />

      <div className='mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div role='tablist' aria-label='Loại giao dịch' className='flex gap-2'>
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type='button'
              role='tab'
              aria-selected={type === tab.value}
              onClick={() => changeParams({ type: tab.value, page: '' })}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                type === tab.value ? 'bg-moss text-cream' : 'border border-clay text-moss hover:border-moss/40'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          aria-label='Lọc theo kết quả'
          value={status}
          onChange={(e) => changeParams({ status: e.target.value, page: '' })}
          className='rounded-xl border border-clay bg-cream px-3.5 py-2.5 text-sm text-forest outline-none focus:border-teal focus:ring-4 focus:ring-teal/15'
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
        <div className='space-y-3 py-4' aria-busy='true' aria-label='Đang tải lịch sử giao dịch'>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className='h-20 animate-pulse rounded-2xl bg-sand' />
          ))}
        </div>
      ) : result.entries.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-12 text-center'>
          <WalletCards size={40} className='text-sage' aria-hidden />
          <p className='font-display text-2xl font-bold text-moss'>
            {type || status ? 'Không có giao dịch nào khớp bộ lọc' : 'Bạn chưa có giao dịch nào'}
          </p>
        </div>
      ) : (
        <>
          <ul className={cn('divide-y divide-clay/50 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            {result.entries.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </ul>
          <div className='mt-6'>
            <Pagination
              page={page}
              pageCount={Math.ceil(result.total_count / PAGE_SIZE)}
              onChange={(next) => changeParams({ page: next > 1 ? String(next) : '' })}
            />
          </div>
        </>
      )}
    </>
  )
}
