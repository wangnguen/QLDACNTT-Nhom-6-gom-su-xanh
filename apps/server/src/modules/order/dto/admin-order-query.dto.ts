import { z } from 'zod/v4'

import { PAYMENT_METHOD, PAYMENT_STATUS, SHIPPING_CARRIER } from '@common/constants'
import { paginationQuerySchema, searchQuerySchema } from '@common/validators'

import { orderStatusSchema } from './order-query.dto'

export const shippingCarrierSchema = z.enum(SHIPPING_CARRIER, 'Đơn vị vận chuyển không hợp lệ')

// Ngày dạng YYYY-MM-DD (giờ Việt Nam)
const dateQuerySchema = z.iso.date('Ngày phải có dạng YYYY-MM-DD')

// US-18: Quản lý đơn hàng (admin)
const AdminOrderQueryBaseSchema = paginationQuerySchema.extend({
  // Mã đơn, mã vận đơn, tên / số điện thoại người nhận, email tài khoản
  search: searchQuerySchema.optional(),
  status: orderStatusSchema.optional(),
  paymentStatus: z.enum(PAYMENT_STATUS, 'Tình trạng thanh toán không hợp lệ').optional(),
  paymentMethod: z.enum(PAYMENT_METHOD, 'Phương thức thanh toán không hợp lệ').optional(),
  // US-19: lọc theo đơn vị vận chuyển (trang vận chuyển)
  shippingCarrier: shippingCarrierSchema.optional(),
  // Đơn đặt trong khoảng ngày [from, to] (tính cả hai ngày)
  from: dateQuerySchema.optional(),
  to: dateQuerySchema.optional()
})

export const AdminOrderQuerySchema = AdminOrderQueryBaseSchema.refine(
  (query) => !query.from || !query.to || query.from <= query.to,
  { message: 'Ngày bắt đầu không được sau ngày kết thúc', path: ['from'] }
)

export type AdminOrderQuery = z.infer<typeof AdminOrderQuerySchema>
