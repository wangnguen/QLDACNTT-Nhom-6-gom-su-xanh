import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { CircleCheckBig, CircleX, LoaderCircle, RotateCw, Store } from 'lucide-react'
import type { OrderDetail, Transaction } from '@lib/api'
import { formatDateTime, formatPrice } from '@lib/utils'
import { PAYMENT_METHOD_LABEL } from '@components/order'
import { useAuthStore } from '@stores/authStore'
import { useCartStore } from '@stores/cartStore'
import { usePaymentResultStore } from './store'

function OrderFacts({ order, transaction }: { order: OrderDetail; transaction?: Transaction }) {
  const rows = [
    { label: 'Mã đơn hàng', value: <span className='font-mono text-base font-bold tracking-wider'>{order.code}</span> },
    { label: 'Tổng tiền', value: formatPrice(order.total) },
    { label: 'Thanh toán', value: PAYMENT_METHOD_LABEL[order.paymentMethod] },
    ...(transaction
      ? [
          { label: 'Mã giao dịch', value: <span className='font-mono'>{transaction.code}</span> },
          ...(transaction.gatewayTransactionNo
            ? [
                {
                  label: 'Mã giao dịch VNPay',
                  value: <span className='font-mono'>{transaction.gatewayTransactionNo}</span>
                }
              ]
            : [])
        ]
      : []),
    { label: 'Giao tới', value: `${order.recipientName} · ${order.recipientPhone}` },
    { label: 'Địa chỉ', value: order.shippingAddress }
  ]
  return (
    <dl className='mt-6 divide-y divide-clay/50 rounded-2xl bg-sand/60 px-5 text-sm'>
      {rows.map((row) => (
        <div key={row.label} className='flex justify-between gap-4 py-3'>
          <dt className='shrink-0 text-muted'>{row.label}</dt>
          <dd className='text-right font-semibold text-forest'>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className='mx-auto max-w-xl px-4 py-12 sm:py-16'>
      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 text-center shadow-sm sm:p-8'>
        {children}
      </section>
    </div>
  )
}

// US-14: Kết quả đặt hàng / thanh toán
// - Quay về từ cổng thanh toán: URL có các tham số vnp_* → gửi cho server kiểm tra rồi hiện kết quả
// - Đơn COD: trang đặt hàng chuyển sang kèm đơn vừa tạo
export default function PaymentResultPage() {
  const { search, state } = useLocation()
  const { result, loading, error, retrying, confirm, retry } = usePaymentResultStore()
  const fetchCart = useCartStore((s) => s.fetch)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const fromGateway = new URLSearchParams(search).has('vnp_TxnRef')
  const placedOrder = (state as { order?: OrderDetail } | null)?.order

  // Sản phẩm đã đặt được bỏ khỏi giỏ từ lúc tạo đơn — tải lại để số trên biểu tượng giỏ hàng đúng.
  // Quay về từ cổng thanh toán là tải lại cả trang: chờ khôi phục phiên đăng nhập xong mới gọi API cần đăng nhập
  useEffect(() => {
    if (isAuthenticated) fetchCart()
  }, [isAuthenticated, fetchCart])

  useEffect(() => {
    if (fromGateway) confirm(search)
  }, [fromGateway, search, confirm])

  if (!fromGateway) {
    if (!placedOrder) return <Navigate to='/' replace />
    return (
      <Shell>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal'>
          <CircleCheckBig size={34} aria-hidden />
        </span>
        <h1 className='mt-4 font-display text-3xl font-bold text-moss'>Đặt hàng thành công!</h1>
        <p className='mt-2 text-ink'>
          Cảm ơn bạn đã mua gốm. Cửa hàng sẽ gọi xác nhận và giao hàng trong 2–5 ngày; vui lòng chuẩn bị{' '}
          {formatPrice(placedOrder.total)} khi nhận hàng.
        </p>
        <OrderFacts order={placedOrder} />
        <Actions />
      </Shell>
    )
  }

  if (loading || (!result && !error)) {
    return (
      <Shell>
        <LoaderCircle size={40} className='mx-auto animate-spin text-teal' aria-hidden />
        <p className='mt-4 font-semibold text-forest'>Đang kiểm tra kết quả thanh toán...</p>
      </Shell>
    )
  }

  if (!result) {
    return (
      <Shell>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger'>
          <CircleX size={34} aria-hidden />
        </span>
        <h1 className='mt-4 font-display text-3xl font-bold text-moss'>Không xác nhận được thanh toán</h1>
        <p className='mt-2 text-ink'>{error}</p>
        <Actions />
      </Shell>
    )
  }

  const { transaction, order } = result
  const paid = transaction.status === 'success'

  return (
    <Shell>
      <span
        className={
          paid
            ? 'mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal'
            : 'mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger'
        }
      >
        {paid ? <CircleCheckBig size={34} aria-hidden /> : <CircleX size={34} aria-hidden />}
      </span>
      <h1 className='mt-4 font-display text-3xl font-bold text-moss'>
        {paid ? 'Thanh toán thành công!' : 'Thanh toán chưa thành công'}
      </h1>
      <p className='mt-2 text-ink'>
        {paid
          ? order.paymentStatus === 'refund_pending'
            ? 'Đơn hàng đã bị huỷ trước khi thanh toán xong. Cửa hàng sẽ hoàn lại tiền cho bạn trong 3–5 ngày làm việc.'
            : `Đã nhận ${formatPrice(transaction.amount)}${
                transaction.completedAt ? ` lúc ${formatDateTime(transaction.completedAt)}` : ''
              }. Cửa hàng sẽ xác nhận và giao hàng trong 2–5 ngày.`
          : `${transaction.message}. Đơn hàng vẫn được giữ, bạn có thể thanh toán lại.`}
      </p>
      {error && <p className='mt-2 text-sm font-semibold text-danger'>{error}</p>}
      <OrderFacts order={order} transaction={transaction} />
      <Actions>
        {order.canPay && !isAuthenticated && (
          <Link to='/login' className='btn-primary'>
            Đăng nhập để thanh toán lại
          </Link>
        )}
        {order.canPay && isAuthenticated && (
          <button type='button' onClick={() => retry(order.id)} disabled={retrying} className='btn-primary'>
            {retrying ? <LoaderCircle size={18} className='animate-spin' /> : <RotateCw size={18} />}
            Thanh toán lại
          </button>
        )}
      </Actions>
    </Shell>
  )
}

function Actions({ children }: { children?: ReactNode }) {
  return (
    <div className='mt-6 flex flex-col justify-center gap-2 sm:flex-row'>
      {children}
      <Link to='/products' className='btn-outline'>
        <Store size={16} />
        Tiếp tục mua sắm
      </Link>
    </div>
  )
}
