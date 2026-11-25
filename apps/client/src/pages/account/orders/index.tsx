import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PackageOpen, RotateCw } from 'lucide-react'
import type { MyOrderQuery, OrderStatus } from '@lib/api'
import { cn } from '@lib/utils'
import { Pagination } from '@components/Pagination'
import { SectionHeader } from '../components'
import { OrderCard } from './components/OrderCard'
import { useMyOrdersStore } from './store'

const PAGE_SIZE = 5

const TABS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đang chuẩn bị' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'returned', label: 'Giao không thành công' }
]

// US-15: Đơn hàng của tôi — lọc theo trạng thái (lưu trên URL), bấm vào đơn để xem chi tiết
export default function MyOrdersPage() {
  const { result, loading, error, fetch } = useMyOrdersStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const status = (searchParams.get('status') ?? '') as '' | OrderStatus
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const query = useMemo<MyOrderQuery>(
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
      <SectionHeader title='Đơn hàng của tôi' description='Theo dõi trạng thái giao hàng và thanh toán của các đơn.' />

      <div
        role='tablist'
        aria-label='Lọc theo trạng thái'
        className='-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]'
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
        <div className='space-y-3' aria-busy='true' aria-label='Đang tải đơn hàng'>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className='h-24 animate-pulse rounded-2xl bg-sand' />
          ))}
        </div>
      ) : result.entries.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-12 text-center'>
          <PackageOpen size={40} className='text-sage' aria-hidden />
          <p className='font-display text-2xl font-bold text-moss'>
            {status ? 'Không có đơn nào ở trạng thái này' : 'Bạn chưa có đơn hàng nào'}
          </p>
          <Link to='/products' className='btn-primary mt-2'>
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          <ul className={cn('space-y-3 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            {result.entries.map((order) => (
              <OrderCard key={order.id} order={order} />
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
