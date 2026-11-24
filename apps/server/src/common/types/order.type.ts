import {
  OrderCancelledBy,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingCarrier,
  TransactionStatus,
  TransactionType
} from '@common/constants'

export type OrderLine = {
  id: string
  // null khi sản phẩm đã bị xoá hẳn
  productId: string | null
  productName: string
  productSlug: string
  imageUrl: string | null
  // Giá mỗi sản phẩm lúc đặt (VND)
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type OrderDetail = {
  id: string
  // Mã đơn hàng, vd DH7K3M9Q
  code: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotal: number
  shippingFee: number
  total: number
  // Tổng số lượng sản phẩm trong đơn
  itemCount: number
  items: OrderLine[]
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note: string | null
  placedAt: Date
  paidAt: Date | null
  confirmedAt: Date | null
  cancelReason: string | null
  cancelledBy: OrderCancelledBy | null
  cancelledAt: Date | null
  shippingCarrier: ShippingCarrier | null
  trackingCode: string | null
  shippedAt: Date | null
  deliveredAt: Date | null
  returnedAt: Date | null
  // Lý do giao không thành công
  deliveryNote: string | null
  // Khách còn thanh toán trực tuyến lại được (đơn VNPay chưa thanh toán, chưa huỷ)
  canPay: boolean
  // Khách còn tự huỷ được (đơn chờ xác nhận)
  canCancel: boolean
}

// Thông tin đơn gắn kèm mỗi giao dịch
export type OrderRef = Pick<OrderDetail, 'id' | 'code' | 'status' | 'total'>

export type TransactionItem = {
  id: string
  // Mã giao dịch gửi sang cổng thanh toán, vd TT7K3M9QX2
  code: string
  type: TransactionType
  method: PaymentMethod
  amount: number
  status: TransactionStatus
  gatewayTransactionNo: string | null
  bankCode: string | null
  responseCode: string | null
  // Diễn giải kết quả cho người đọc, vd "Khách hàng huỷ giao dịch"
  message: string
  note: string | null
  createdAt: Date
  completedAt: Date | null
  order: OrderRef
}

export type OrderCustomer = {
  id: string
  fullName: string
  email: string
  phone: string | null
}

// Đơn hàng ở trang admin: kèm tài khoản đặt hàng
export type AdminOrder = OrderDetail & {
  customer: OrderCustomer
}

export type AdminOrderDetail = AdminOrder & {
  // Mọi lượt thanh toán / hoàn tiền của đơn, mới nhất lên trước
  transactions: TransactionItem[]
}

export type CheckoutResult = {
  order: OrderDetail
  // Link chuyển sang cổng thanh toán (đơn thanh toán trực tuyến), null với COD
  paymentUrl: string | null
}

export type PaymentMethodOption = {
  method: PaymentMethod
  enabled: boolean
  // Đang dùng cổng thanh toán giả lập (môi trường phát triển)
  sandbox: boolean
}

export type PaymentResult = {
  transaction: TransactionItem
  order: OrderDetail
}
