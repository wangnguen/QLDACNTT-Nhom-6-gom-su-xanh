import type { OrderStatus, PaymentMethod, PaymentStatus, TransactionStatus } from '@lib/api'

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Chờ giao', className: 'bg-teal/10 text-teal' },
  shipping: { label: 'Đang giao', className: 'bg-leaf/15 text-leaf' },
  delivered: { label: 'Đã giao', className: 'bg-moss/10 text-moss' },
  cancelled: { label: 'Đã huỷ', className: 'bg-clay/40 text-muted' },
  returned: { label: 'Hoàn hàng', className: 'bg-danger/10 text-danger' }
}

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: 'Chưa thanh toán', className: 'text-warning' },
  paid: { label: 'Đã thanh toán', className: 'text-teal' },
  refund_pending: { label: 'Chờ hoàn tiền', className: 'text-danger' },
  refunded: { label: 'Đã hoàn tiền', className: 'text-muted' }
}

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  cod: 'COD',
  vnpay: 'VNPay'
}

export const TRANSACTION_STATUS: Record<TransactionStatus, { label: string; className: string }> = {
  pending: { label: 'Đang xử lý', className: 'bg-warning/10 text-warning' },
  success: { label: 'Thành công', className: 'bg-teal/10 text-teal' },
  failed: { label: 'Thất bại', className: 'bg-danger/10 text-danger' }
}

export const statusBadge = 'inline-block rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap'
