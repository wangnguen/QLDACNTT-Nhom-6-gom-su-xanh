import { z } from 'zod/v4'

import { PAYMENT_METHOD } from '@common/constants'
import { paginationQuerySchema, searchQuerySchema } from '@common/validators'

import { transactionStatusSchema, transactionTypeSchema } from './transaction-query.dto'

// Ngày dạng YYYY-MM-DD (giờ Việt Nam)
const dateQuerySchema = z.iso.date('Ngày phải có dạng YYYY-MM-DD')

const dateRange = {
  // Giao dịch tạo trong khoảng ngày [from, to] (tính cả hai ngày)
  from: dateQuerySchema.optional(),
  to: dateQuerySchema.optional()
}

const validRange = (query: { from?: string; to?: string }) => !query.from || !query.to || query.from <= query.to
const rangeError = { message: 'Ngày bắt đầu không được sau ngày kết thúc', path: ['from'] }

// US-20: Quản lý giao dịch thanh toán (admin)
export const AdminTransactionQuerySchema = paginationQuerySchema
  .extend({
    // Mã giao dịch, mã giao dịch VNPay, mã đơn, email khách
    search: searchQuerySchema.optional(),
    type: transactionTypeSchema.optional(),
    status: transactionStatusSchema.optional(),
    method: z.enum(PAYMENT_METHOD, 'Phương thức thanh toán không hợp lệ').optional(),
    ...dateRange
  })
  .refine(validRange, rangeError)

export type AdminTransactionQuery = z.infer<typeof AdminTransactionQuerySchema>

export const TransactionSummaryQuerySchema = z.object(dateRange).refine(validRange, rangeError)

export type TransactionSummaryQuery = z.infer<typeof TransactionSummaryQuerySchema>
