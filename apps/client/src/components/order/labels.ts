import type { OrderStatus, PaymentMethod, PaymentStatus, ShippingCarrier } from '@lib/api'

export const ORDER_STATUS_LABEL: Record<OrderStatus, { text: string; className: string }> = {
  pending: { text: 'Chờ xác nhận', className: 'bg-warning/10 text-warning' },
  confirmed: { text: 'Đang chuẩn bị', className: 'bg-teal/10 text-teal' },
  shipping: { text: 'Đang giao', className: 'bg-leaf/15 text-leaf' },
  delivered: { text: 'Đã giao', className: 'bg-moss/10 text-moss' },
  cancelled: { text: 'Đã huỷ', className: 'bg-clay/40 text-muted' },
  returned: { text: 'Giao không thành công', className: 'bg-danger/10 text-danger' }
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, { text: string; className: string }> = {
  unpaid: { text: 'Chưa thanh toán', className: 'text-warning' },
  paid: { text: 'Đã thanh toán', className: 'text-teal' },
  refund_pending: { text: 'Chờ hoàn tiền', className: 'text-warning' },
  refunded: { text: 'Đã hoàn tiền', className: 'text-muted' }
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  vnpay: 'Thanh toán trực tuyến qua VNPay'
}

export const SHIPPING_CARRIER_LABEL: Record<ShippingCarrier, string> = {
  ghn: 'Giao Hàng Nhanh (GHN)',
  ghtk: 'Giao Hàng Tiết Kiệm (GHTK)',
  viettel_post: 'Viettel Post',
  vnpost: 'VNPost',
  jt: 'J&T Express',
  shop: 'Cửa hàng tự giao'
}
