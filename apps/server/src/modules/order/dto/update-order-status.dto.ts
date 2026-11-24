import { z } from 'zod/v4'

import { ADMIN_ORDER_ACTIONS } from '@common/constants'

import { cancelReasonSchema } from './cancel-order.dto'

// US-18: Cửa hàng xác nhận hoặc huỷ đơn
const UpdateOrderStatusBodyBaseSchema = z.object({
  status: z.enum(ADMIN_ORDER_ACTIONS, 'Trạng thái chỉ được là confirmed hoặc cancelled'),
  // Chỉ dùng khi huỷ; khách sẽ thấy lý do này
  cancelReason: cancelReasonSchema
})

export const UpdateOrderStatusBodyExample = {
  status: 'cancelled',
  cancelReason: 'Sản phẩm bị lỗi men khi kiểm hàng, cửa hàng xin lỗi quý khách'
} satisfies z.input<typeof UpdateOrderStatusBodyBaseSchema>

export const UpdateOrderStatusBodySchema = UpdateOrderStatusBodyBaseSchema.meta({
  example: UpdateOrderStatusBodyExample
})

export type UpdateOrderStatusBody = z.infer<typeof UpdateOrderStatusBodySchema>
