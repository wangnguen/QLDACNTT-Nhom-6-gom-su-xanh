import { z } from 'zod/v4'

import { ORDER_STATUS } from '@common/constants'
import { paginationQuerySchema } from '@common/validators'

export const orderStatusSchema = z.enum(ORDER_STATUS, 'Trạng thái đơn hàng không hợp lệ')

// US-15: Đơn hàng của tôi
export const MyOrderQuerySchema = paginationQuerySchema.extend({
  status: orderStatusSchema.optional()
})

export type MyOrderQuery = z.infer<typeof MyOrderQuerySchema>
