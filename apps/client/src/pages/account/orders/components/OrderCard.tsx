import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { OrderDetail } from '@lib/api'
import { cn, formatDateTime, formatPrice } from '@lib/utils'
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@components/order'
import { ProductImage } from '@components/product'

const PREVIEW_COUNT = 3

// Một đơn trong "Đơn hàng của tôi": mã, ngày đặt, ảnh vài sản phẩm, tổng tiền, trạng thái
export function OrderCard({ order }: { order: OrderDetail }) {
  const status = ORDER_STATUS_LABEL[order.status]
  const payment = PAYMENT_STATUS_LABEL[order.paymentStatus]
  const extra = order.items.length - PREVIEW_COUNT

  return (
    <li>
      <Link
        to={`/account/orders/${order.id}`}
        className='group flex flex-col gap-4 rounded-2xl border border-clay/60 p-4 transition-colors hover:border-moss/40 hover:bg-sand/40 sm:flex-row sm:items-center'
      >
        <div className='flex shrink-0 -space-x-3'>
          {order.items.slice(0, PREVIEW_COUNT).map((item) => (
            <ProductImage
              key={item.id}
              src={item.imageUrl}
              alt={item.productName}
              className='h-14 w-14 rounded-xl border-2 border-cream'
            />
          ))}
          {extra > 0 && (
            <span className='flex h-14 w-14 items-center justify-center rounded-xl border-2 border-cream bg-sand text-sm font-bold text-moss'>
              +{extra}
            </span>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-mono text-sm font-bold tracking-wider text-forest'>{order.code}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', status.className)}>{status.text}</span>
          </div>
          <p className='mt-1 truncate text-sm text-ink'>
            {order.items[0]?.productName}
            {order.items.length > 1 && ` và ${order.items.length - 1} sản phẩm khác`}
          </p>
          <p className='mt-0.5 text-xs text-muted'>Đặt lúc {formatDateTime(order.placedAt)}</p>
        </div>

        <div className='flex items-center justify-between gap-3 sm:block sm:text-right'>
          <p className='font-display text-xl font-bold text-teal'>{formatPrice(order.total)}</p>
          <p className={cn('text-xs font-semibold', payment.className)}>{payment.text}</p>
        </div>
        <ChevronRight size={20} className='hidden shrink-0 text-muted group-hover:text-moss sm:block' aria-hidden />
      </Link>
    </li>
  )
}
