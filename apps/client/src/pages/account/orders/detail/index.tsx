import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, LoaderCircle, MapPin, Phone, RotateCw, UserRound } from 'lucide-react'
import { cn, formatDateTime, formatPrice } from '@lib/utils'
import {
  ORDER_STATUS_LABEL,
  OrderTimeline,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  TransactionItem
} from '@components/order'
import { ProductImage } from '@components/product'
import { ErrorBanner } from '@pages/auth/components'
import { CancelOrder } from './components/CancelOrder'
import { useOrderDetailStore } from './store'

const card = 'rounded-2xl border border-clay/60 p-5'

// US-15: Chi tiết đơn hàng — sản phẩm, tiền, người nhận, thanh toán và tiến trình đơn
export default function OrderDetailPage() {
  const { id = '' } = useParams()
  const { order, transactions, loading, error, paying, cancelling, fetch, pay, cancel } = useOrderDetailStore()

  useEffect(() => {
    fetch(id)
  }, [fetch, id])

  if (!order) {
    if (error) {
      return (
        <div className='flex flex-col items-center gap-3 py-12 text-center'>
          <p className='font-semibold text-danger'>{error}</p>
          <div className='flex gap-2'>
            <Link to='/account/orders' className='btn-outline'>
              <ArrowLeft size={16} />
              Đơn hàng của tôi
            </Link>
            <button type='button' onClick={() => fetch(id)} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className='space-y-4' aria-busy='true' aria-label='Đang tải đơn hàng'>
        <div className='h-10 w-64 animate-pulse rounded bg-sand' />
        <div className='h-64 animate-pulse rounded-2xl bg-sand' />
      </div>
    )
  }

  const status = ORDER_STATUS_LABEL[order.status]
  const payment = PAYMENT_STATUS_LABEL[order.paymentStatus]

  return (
    <div className={cn('transition-opacity', loading && 'opacity-60')}>
      <Link
        to='/account/orders'
        className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'
      >
        <ArrowLeft size={16} />
        Đơn hàng của tôi
      </Link>

      <header className='mt-3 mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-clay/50 pb-5'>
        <div>
          <h2 className='font-display text-2xl font-bold text-moss sm:text-3xl'>
            Đơn <span className='font-mono tracking-wider'>{order.code}</span>
          </h2>
          <p className='mt-1 text-sm text-muted'>Đặt lúc {formatDateTime(order.placedAt)}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-sm font-bold', status.className)}>{status.text}</span>
      </header>

      <ErrorBanner message={error} />

      {order.canPay && (
        <div className='mb-5 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sm text-ink'>
            Đơn hàng chưa được thanh toán. Thanh toán để cửa hàng xác nhận và giao hàng cho bạn.
          </p>
          <button type='button' onClick={() => pay(order)} disabled={paying} className='btn-primary shrink-0'>
            {paying ? <LoaderCircle size={18} className='animate-spin' /> : <CreditCard size={18} />}
            Thanh toán {formatPrice(order.total)}
          </button>
        </div>
      )}

      {order.status === 'cancelled' && (
        <p className='mb-5 rounded-2xl bg-sand/70 p-4 text-sm text-ink'>
          {order.cancelledBy === 'admin' ? 'Cửa hàng đã huỷ đơn hàng này' : 'Bạn đã huỷ đơn hàng này'}
          {order.cancelReason && (
            <>
              . Lý do: <span className='font-semibold'>{order.cancelReason}</span>
            </>
          )}
          {order.paymentStatus === 'refund_pending' && '. Cửa hàng sẽ hoàn tiền cho bạn trong 3–5 ngày làm việc.'}
        </p>
      )}

      <div className='grid gap-5 lg:grid-cols-[1fr_16rem]'>
        <div className='space-y-5'>
          <section className={card} aria-label='Sản phẩm'>
            <ul className='divide-y divide-clay/50'>
              {order.items.map((item) => (
                <li key={item.id} className='flex gap-3 py-3 first:pt-0 last:pb-0'>
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.productName}
                    className='h-16 w-16 shrink-0 rounded-xl border border-clay/60'
                  />
                  <div className='min-w-0 flex-1'>
                    {item.productId ? (
                      <Link
                        to={`/products/${item.productSlug}`}
                        className='line-clamp-2 text-sm font-semibold text-forest hover:text-teal'
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <p className='line-clamp-2 text-sm font-semibold text-forest'>{item.productName}</p>
                    )}
                    <p className='text-xs text-muted'>
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className='shrink-0 text-sm font-semibold'>{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className='mt-4 space-y-2 border-t border-clay/50 pt-4 text-sm'>
              <div className='flex justify-between'>
                <dt className='text-muted'>Tạm tính ({order.itemCount} sản phẩm)</dt>
                <dd className='font-semibold'>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-muted'>Phí giao hàng</dt>
                <dd className='font-semibold'>
                  {order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}
                </dd>
              </div>
              <div className='flex items-baseline justify-between border-t border-clay/50 pt-3'>
                <dt className='font-semibold text-forest'>Tổng cộng</dt>
                <dd className='font-display text-2xl font-bold text-teal'>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <div className='grid gap-5 sm:grid-cols-2'>
            <section className={card}>
              <h3 className='text-sm font-bold tracking-wider text-muted uppercase'>Giao tới</h3>
              <ul className='mt-3 space-y-2 text-sm text-forest'>
                <li className='flex gap-2'>
                  <UserRound size={16} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                  {order.recipientName}
                </li>
                <li className='flex gap-2'>
                  <Phone size={16} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                  {order.recipientPhone}
                </li>
                <li className='flex gap-2'>
                  <MapPin size={16} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                  {order.shippingAddress}
                </li>
              </ul>
              {order.note && <p className='mt-3 text-sm text-ink italic'>“{order.note}”</p>}
            </section>
            <section className={card}>
              <h3 className='text-sm font-bold tracking-wider text-muted uppercase'>Thanh toán</h3>
              <p className='mt-3 text-sm font-semibold text-forest'>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
              <p className={cn('mt-1 text-sm font-bold', payment.className)}>{payment.text}</p>
              {order.paidAt && <p className='mt-1 text-xs text-muted'>Lúc {formatDateTime(order.paidAt)}</p>}
            </section>
          </div>

          {transactions.length > 0 && (
            <section className={card} aria-label='Giao dịch của đơn'>
              <h3 className='text-sm font-bold tracking-wider text-muted uppercase'>Giao dịch</h3>
              <ul className='divide-y divide-clay/50'>
                {transactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} showOrder={false} />
                ))}
              </ul>
            </section>
          )}
        </div>

        <section className={card} aria-label='Tiến trình đơn hàng'>
          <h3 className='mb-4 text-sm font-bold tracking-wider text-muted uppercase'>Tiến trình</h3>
          <OrderTimeline order={order} />
          <div className='mt-5 border-t border-clay/50 pt-4 empty:hidden'>
            <CancelOrder order={order} cancelling={cancelling} onCancel={(reason) => cancel(order, reason)} />
          </div>
        </section>
      </div>
    </div>
  )
}
