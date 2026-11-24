import { CUSTOMER_CANCELLABLE_STATUSES, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@common/constants'
import { OrderDetail, OrderLine, OrderRef } from '@common/types'

import { OrderItem } from '@entities/order-item.entity'
import { Order } from '@entities/order.entity'

const toOrderLine = (item: OrderItem): OrderLine => ({
  id: item.id,
  productId: item.productId,
  productName: item.productName,
  productSlug: item.productSlug,
  imageUrl: item.imageUrl,
  unitPrice: item.unitPrice,
  quantity: item.quantity,
  lineTotal: item.lineTotal
})

// Đơn thanh toán trực tuyến chưa trả tiền và chưa bị huỷ thì khách thanh toán lại được
export const canPayOnline = (order: Order): boolean =>
  order.paymentMethod === PAYMENT_METHOD.VNPAY &&
  order.paymentStatus === PAYMENT_STATUS.UNPAID &&
  order.status === ORDER_STATUS.PENDING

// `order.items` phải được load kèm; các dòng được lưu cùng lúc nên sắp theo tên cho thứ tự ổn định
export const toOrderDetail = (order: Order): OrderDetail => {
  const items = [...order.items]
    .sort((a, b) => a.productName.localeCompare(b.productName, 'vi') || a.id.localeCompare(b.id))
    .map(toOrderLine)
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    shippingAddress: order.shippingAddress,
    note: order.note,
    placedAt: order.createdAt,
    paidAt: order.paidAt,
    confirmedAt: order.confirmedAt,
    cancelReason: order.cancelReason,
    cancelledBy: order.cancelledBy,
    cancelledAt: order.cancelledAt,
    canPay: canPayOnline(order),
    canCancel: CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)
  }
}

export const toOrderRef = (order: Order): OrderRef => ({
  id: order.id,
  code: order.code,
  status: order.status,
  total: order.total
})
