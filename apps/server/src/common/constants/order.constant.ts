export const ORDER_STATUS = {
  // Chờ cửa hàng xác nhận
  PENDING: 'pending',
  // Đã xác nhận, đang chuẩn bị hàng
  CONFIRMED: 'confirmed',
  // Đã giao cho đơn vị vận chuyển
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  // Giao không thành công, hàng được hoàn về cửa hàng
  RETURNED: 'returned'
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const PAYMENT_METHOD = {
  // Thanh toán khi nhận hàng
  COD: 'cod',
  // Thanh toán trực tuyến qua cổng VNPay (thẻ ATM, QR, thẻ quốc tế)
  VNPAY: 'vnpay'
} as const

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

// Tình trạng thanh toán của đơn hàng
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  // Đơn đã thanh toán bị huỷ/hoàn, chờ cửa hàng hoàn tiền
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded'
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const ORDER_CANCELLED_BY = {
  USER: 'user',
  ADMIN: 'admin'
} as const

export type OrderCancelledBy = (typeof ORDER_CANCELLED_BY)[keyof typeof ORDER_CANCELLED_BY]

// Phí giao hàng đồng giá (VND); đơn từ FREE_SHIPPING_THRESHOLD trở lên được miễn phí giao hàng
export const SHIPPING_FEE = 30_000
export const FREE_SHIPPING_THRESHOLD = 1_000_000

// Link thanh toán VNPay hết hạn sau bao nhiêu phút
export const PAYMENT_EXPIRE_MINUTES = 15

// Khách tự huỷ được khi đơn còn chờ xác nhận; đơn đã xác nhận phải liên hệ cửa hàng
export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = [ORDER_STATUS.PENDING]

// Cửa hàng huỷ được đơn chưa giao cho đơn vị vận chuyển
export const ADMIN_CANCELLABLE_STATUSES: OrderStatus[] = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED]

// Trạng thái admin chuyển sang ở trang quản lý đơn hàng (giao hàng xử lý ở trang vận chuyển)
export const ADMIN_ORDER_ACTIONS = [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED] as const

// ─── Vận chuyển ───────────────────────────────────────────────────────────────

// Đơn vị vận chuyển cửa hàng dùng; `shop` = cửa hàng tự giao
export const SHIPPING_CARRIER = {
  GHN: 'ghn',
  GHTK: 'ghtk',
  VIETTEL_POST: 'viettel_post',
  VNPOST: 'vnpost',
  JT: 'jt',
  SHOP: 'shop'
} as const

export type ShippingCarrier = (typeof SHIPPING_CARRIER)[keyof typeof SHIPPING_CARRIER]

export const SHIPMENT_ACTION = {
  // Giao cho đơn vị vận chuyển: đã xác nhận → đang giao
  SHIP: 'ship',
  // Sửa đơn vị vận chuyển / mã vận đơn khi đang giao
  UPDATE: 'update',
  // Giao thành công: đang giao → đã giao (đơn COD ghi nhận đã thu tiền)
  DELIVER: 'deliver',
  // Giao không thành công, hàng hoàn về: đang giao → đã hoàn hàng
  RETURN: 'return'
} as const

export type ShipmentAction = (typeof SHIPMENT_ACTION)[keyof typeof SHIPMENT_ACTION]

export const ORDER_NOT_FOUND_MESSAGE = 'Không tìm thấy đơn hàng'

// ─── Giao dịch thanh toán ─────────────────────────────────────────────────────

export const TRANSACTION_TYPE = {
  // Khách trả tiền cho đơn hàng
  PAYMENT: 'payment',
  // Cửa hàng hoàn tiền cho khách
  REFUND: 'refund'
} as const

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE]

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
} as const

export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS]

export const TRANSACTION_NOT_FOUND_MESSAGE = 'Không tìm thấy giao dịch'
