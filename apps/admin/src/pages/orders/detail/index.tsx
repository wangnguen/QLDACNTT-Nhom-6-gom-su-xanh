import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCheck, LoaderCircle, Mail, MapPin, Phone, RotateCw, UserRound, XCircle } from 'lucide-react'
import type { AdminOrderDetail } from '@lib/api'
import { cn, formatDateTime, formatPrice } from '@lib/utils'
import { Thumbnail } from '@components/ui'
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, TRANSACTION_STATUS, statusBadge } from '@components/order'
import { CancelOrderDialog } from '../components/CancelOrderDialog'
import { ShipmentPanel } from './components/ShipmentPanel'
import { useOrderDetailStore } from './store'

const card = 'rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-5 shadow-sm sm:p-6'

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn(card, className)}>
      <h2 className='mb-4 text-xs font-bold tracking-wider text-muted uppercase'>{title}</h2>
      {children}
    </section>
  )
}

// Các mốc thời gian của đơn
function Milestones({ order }: { order: AdminOrderDetail }) {
  const rows = [
    { label: 'Đặt hàng', at: order.placedAt },
    { label: 'Thanh toán', at: order.paidAt },
    { label: 'Xác nhận', at: order.confirmedAt },
    { label: 'Giao cho vận chuyển', at: order.shippedAt },
    { label: 'Đã giao', at: order.deliveredAt },
    { label: 'Hoàn hàng', at: order.returnedAt },
    { label: order.cancelledBy === 'admin' ? 'Cửa hàng huỷ' : 'Khách huỷ', at: order.cancelledAt }
  ].filter((row) => row.at)
  return (
    <dl className='space-y-2 text-sm'>
      {rows.map((row) => (
        <div key={row.label} className='flex justify-between gap-3'>
          <dt className='text-muted'>{row.label}</dt>
          <dd className='font-medium whitespace-nowrap'>{formatDateTime(row.at!)}</dd>
        </div>
      ))}
    </dl>
  )
}

// US-18: Chi tiết đơn hàng — sản phẩm, khách, thanh toán, các mốc thời gian và thao tác xác nhận / huỷ
export default function OrderDetailPage() {
  const { id = '' } = useParams()
  const { order, loading, loadError, updating, fetch, updateStatus } = useOrderDetailStore()
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetch(id)
  }, [fetch, id])

  if (!order) {
    return (
      <div className='mx-auto max-w-6xl'>
        {loadError ? (
          <div className='flex flex-col items-center gap-3 py-16 text-center'>
            <p className='font-semibold text-danger'>{loadError}</p>
            <div className='flex gap-2'>
              <Link to='/orders' className='btn-outline'>
                <ArrowLeft size={16} />
                Danh sách đơn
              </Link>
              <button type='button' onClick={() => fetch(id)} className='btn-outline'>
                <RotateCw size={16} />
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <div className='space-y-4' aria-busy='true' aria-label='Đang tải đơn hàng'>
            <div className='h-12 w-72 animate-pulse rounded-xl bg-cream' />
            <div className='h-80 animate-pulse rounded-[var(--radius-organic)] bg-cream' />
          </div>
        )}
      </div>
    )
  }

  const status = ORDER_STATUS[order.status]
  const payment = PAYMENT_STATUS[order.paymentStatus]
  const canConfirm = order.status === 'pending'
  const waitingPayment = canConfirm && order.paymentMethod === 'vnpay' && order.paymentStatus !== 'paid'
  const canCancel = order.status === 'pending' || order.status === 'confirmed'

  const handleCancel = async (reason: string) => {
    if (await updateStatus('cancelled', reason)) setCancelling(false)
  }

  return (
    <div className={cn('mx-auto max-w-6xl transition-opacity', loading && 'opacity-70')}>
      <Link to='/orders' className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'>
        <ArrowLeft size={16} />
        Danh sách đơn
      </Link>

      <div className='mt-3 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='font-display text-4xl font-bold text-moss'>
              Đơn <span className='font-mono tracking-wider'>{order.code}</span>
            </h1>
            <span className={cn(statusBadge, 'text-sm', status.className)}>{status.label}</span>
          </div>
          <p className='mt-1.5 text-ink'>Đặt lúc {formatDateTime(order.placedAt)}</p>
        </div>

        {(canConfirm || canCancel) && (
          <div className='flex flex-wrap items-center gap-2'>
            {updating && <LoaderCircle size={18} className='animate-spin text-muted' />}
            {canCancel && (
              <button
                type='button'
                onClick={() => setCancelling(true)}
                disabled={updating}
                className='inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/5 disabled:opacity-50'
              >
                <XCircle size={16} />
                Huỷ đơn
              </button>
            )}
            {canConfirm && (
              <button
                type='button'
                onClick={() => updateStatus('confirmed')}
                disabled={updating || waitingPayment}
                title={waitingPayment ? 'Đơn VNPay chưa được thanh toán' : undefined}
                className='btn-primary'
              >
                <CheckCheck size={18} />
                Xác nhận đơn
              </button>
            )}
          </div>
        )}
      </div>

      {waitingPayment && (
        <p className='mb-5 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning'>
          Đơn thanh toán trực tuyến chưa được thanh toán — chỉ xác nhận được sau khi khách thanh toán xong.
        </p>
      )}
      {order.status === 'cancelled' && (
        <p className='mb-5 rounded-2xl bg-clay/30 p-4 text-sm text-ink'>
          {order.cancelledBy === 'admin' ? 'Cửa hàng đã huỷ đơn' : 'Khách đã tự huỷ đơn'}
          {order.cancelReason && (
            <>
              . Lý do: <span className='font-semibold'>{order.cancelReason}</span>
            </>
          )}
        </p>
      )}

      <div className='grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start'>
        <div className='space-y-5'>
          <Section title={`Sản phẩm (${order.itemCount})`}>
            <ul className='divide-y divide-clay/50'>
              {order.items.map((item) => (
                <li key={item.id} className='flex items-center gap-3 py-3 first:pt-0'>
                  <Thumbnail src={item.imageUrl} alt={item.productName} />
                  <div className='min-w-0 flex-1'>
                    <p className='font-semibold text-forest'>{item.productName}</p>
                    <p className='text-xs text-muted'>
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className='font-semibold'>{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className='mt-2 space-y-2 border-t border-clay/50 pt-4 text-sm'>
              <div className='flex justify-between'>
                <dt className='text-muted'>Tạm tính</dt>
                <dd className='font-semibold'>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-muted'>Phí giao hàng</dt>
                <dd className='font-semibold'>{order.shippingFee ? formatPrice(order.shippingFee) : 'Miễn phí'}</dd>
              </div>
              <div className='flex items-baseline justify-between border-t border-clay/50 pt-3'>
                <dt className='font-semibold'>Tổng cộng</dt>
                <dd className='font-display text-2xl font-bold text-teal'>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Section>

          <Section title='Giao dịch thanh toán'>
            {order.transactions.length === 0 ? (
              <p className='text-sm text-muted'>
                {order.paymentMethod === 'cod'
                  ? 'Đơn COD — giao dịch được ghi nhận khi giao hàng thành công.'
                  : 'Chưa có giao dịch.'}
              </p>
            ) : (
              <ul className='divide-y divide-clay/50'>
                {order.transactions.map((transaction) => {
                  const badge = TRANSACTION_STATUS[transaction.status]
                  return (
                    <li
                      key={transaction.id}
                      className='flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0'
                    >
                      <div>
                        <p className='text-sm font-semibold text-forest'>
                          {transaction.type === 'refund' ? 'Hoàn tiền' : 'Thanh toán'} ·{' '}
                          {PAYMENT_METHOD[transaction.method]}{' '}
                          <span className={cn(statusBadge, 'ml-1 px-2 py-0.5', badge.className)}>{badge.label}</span>
                        </p>
                        <p className='mt-0.5 text-xs text-ink'>{transaction.message}</p>
                        <p className='mt-0.5 font-mono text-xs text-muted'>
                          {transaction.code}
                          {transaction.gatewayTransactionNo && ` · ${transaction.gatewayTransactionNo}`}
                          {transaction.bankCode && ` · ${transaction.bankCode}`}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold'>
                          {transaction.type === 'refund' ? '−' : '+'}
                          {formatPrice(transaction.amount)}
                        </p>
                        <p className='text-xs text-muted'>
                          {formatDateTime(transaction.completedAt ?? transaction.createdAt)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>

        <div className='space-y-5'>
          <Section title='Khách hàng'>
            <ul className='space-y-2 text-sm'>
              <li className='flex gap-2'>
                <UserRound size={16} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                <span>
                  <span className='font-semibold'>{order.recipientName}</span>
                  {order.customer.fullName !== order.recipientName && (
                    <span className='block text-xs text-muted'>Tài khoản: {order.customer.fullName}</span>
                  )}
                </span>
              </li>
              <li className='flex gap-2'>
                <Phone size={16} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                <a href={`tel:${order.recipientPhone}`} className='link font-medium'>
                  {order.recipientPhone}
                </a>
              </li>
              <li className='flex gap-2'>
                <Mail size={16} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                <span className='break-all'>{order.customer.email}</span>
              </li>
              <li className='flex gap-2'>
                <MapPin size={16} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                {order.shippingAddress}
              </li>
            </ul>
            {order.note && <p className='mt-3 rounded-xl bg-sand/70 p-3 text-sm text-ink italic'>“{order.note}”</p>}
          </Section>

          {order.status !== 'cancelled' && (
            <Section title='Vận chuyển'>
              <ShipmentPanel order={order} />
            </Section>
          )}

          <Section title='Thanh toán'>
            <p className='text-sm font-semibold'>
              {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán trực tuyến qua VNPay'}
            </p>
            <p className={cn('mt-1 text-sm font-bold', payment.className)}>{payment.label}</p>
          </Section>

          <Section title='Các mốc thời gian'>
            <Milestones order={order} />
          </Section>
        </div>
      </div>

      <CancelOrderDialog
        key={cancelling ? order.id : 'closed'}
        order={cancelling ? order : null}
        loading={updating}
        onConfirm={handleCancel}
        onClose={() => setCancelling(false)}
      />
    </div>
  )
}
