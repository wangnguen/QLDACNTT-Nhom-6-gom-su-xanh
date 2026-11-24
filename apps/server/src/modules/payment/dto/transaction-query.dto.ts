import { z } from 'zod/v4'

import { TRANSACTION_STATUS, TRANSACTION_TYPE } from '@common/constants'
import { paginationQuerySchema, uuidSchema } from '@common/validators'

export const transactionTypeSchema = z.enum(TRANSACTION_TYPE, 'Loại giao dịch không hợp lệ')
export const transactionStatusSchema = z.enum(TRANSACTION_STATUS, 'Trạng thái giao dịch không hợp lệ')

// US-17: Lịch sử giao dịch của tôi
export const MyTransactionQuerySchema = paginationQuerySchema.extend({
  type: transactionTypeSchema.optional(),
  status: transactionStatusSchema.optional(),
  // Các giao dịch của một đơn (trang chi tiết đơn hàng)
  orderId: uuidSchema.optional()
})

export type MyTransactionQuery = z.infer<typeof MyTransactionQuerySchema>
