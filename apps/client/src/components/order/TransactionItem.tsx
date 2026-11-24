import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react'
import type { Transaction, TransactionStatus } from '@lib/api'
import { cn, formatDateTime, formatPrice } from '@lib/utils'

const STATUS: Record<TransactionStatus, { text: string; className: string }> = {
  pending: { text: 'Đang xử lý', className: 'bg-warning/10 text-warning' },
  success: { text: 'Thành công', className: 'bg-teal/10 text-teal' },
  failed: { text: 'Thất bại', className: 'bg-danger/10 text-danger' }
}

const METHOD = { vnpay: 'VNPay', cod: 'Tiền mặt (COD)' }

interface Props {
  transaction: Transaction
  // Ẩn liên kết tới đơn khi đang ở chính trang chi tiết đơn đó
  showOrder?: boolean
}

// US-17: Một giao dịch — thanh toán (tiền ra) hoặc hoàn tiền (tiền về), kèm kết quả và đơn hàng liên quan
export function TransactionItem({ transaction, showOrder = true }: Props) {
  const refund = transaction.type === 'refund'
  const status = STATUS[transaction.status]
  const Icon = refund ? ArrowDownLeft : transaction.method === 'cod' ? Banknote : ArrowUpRight

  return (
    <li className='flex gap-3 py-4'>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          refund ? 'bg-teal/10 text-teal' : 'bg-moss/10 text-moss'
        )}
      >
        <Icon size={18} aria-hidden />
      </span>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='font-semibold text-forest'>
            {refund ? 'Hoàn tiền' : 'Thanh toán'} · {METHOD[transaction.method]}
          </p>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', status.className)}>{status.text}</span>
        </div>
        <p className='mt-0.5 text-sm text-ink'>{transaction.message}</p>
        <p className='mt-1 text-xs text-muted'>
          <span className='font-mono'>{transaction.code}</span>
          {transaction.gatewayTransactionNo && (
            <>
              {' '}
              · Mã tham chiếu <span className='font-mono'>{transaction.gatewayTransactionNo}</span>
            </>
          )}{' '}
          · {formatDateTime(transaction.completedAt ?? transaction.createdAt)}
        </p>
        {showOrder && (
          <Link
            to={`/account/orders/${transaction.order.id}`}
            className='mt-1 inline-block font-mono text-xs font-bold tracking-wider text-teal hover:underline'
          >
            Đơn {transaction.order.code}
          </Link>
        )}
      </div>
      <p
        className={cn(
          'shrink-0 font-display text-lg font-bold',
          transaction.status === 'failed' ? 'text-muted line-through' : refund ? 'text-teal' : 'text-forest'
        )}
      >
        {refund ? '+' : '−'}
        {formatPrice(transaction.amount)}
      </p>
    </li>
  )
}
