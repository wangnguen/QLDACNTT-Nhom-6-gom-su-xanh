import { describe, expect, it } from 'vitest'

import {
  AdminTransactionQuerySchema,
  CompleteRefundBodySchema,
  MyTransactionQuerySchema,
  TransactionSummaryQuerySchema
} from '@modules/payment/dto'

describe('MyTransactionQuerySchema', () => {
  it('mặc định trang đầu, lọc theo loại, trạng thái, đơn hàng', () => {
    const orderId = '3c4d5e6f-7a8b-4c9d-8e0f-123456789abc'
    expect(MyTransactionQuerySchema.parse({ type: 'refund', status: 'pending', orderId })).toEqual({
      limit: 12,
      offset: 0,
      type: 'refund',
      status: 'pending',
      orderId
    })
  })

  it.each([
    ['loại lạ', { type: 'transfer' }],
    ['trạng thái lạ', { status: 'done' }],
    ['orderId không phải UUID', { orderId: 'DH7K3M9Q' }]
  ])('từ chối khi %s', (_case, query) => {
    expect(MyTransactionQuerySchema.safeParse(query).success).toBe(false)
  })
})

describe('AdminTransactionQuerySchema', () => {
  it('nhận đủ bộ lọc', () => {
    expect(
      AdminTransactionQuerySchema.parse({ search: 'TT7K', type: 'payment', method: 'cod', from: '2026-11-01' })
    ).toEqual({ limit: 12, offset: 0, search: 'TT7K', type: 'payment', method: 'cod', from: '2026-11-01' })
  })

  it.each([
    ['phương thức lạ', { method: 'momo' }],
    ['từ ngày sau đến ngày', { from: '2026-12-01', to: '2026-11-01' }]
  ])('từ chối khi %s', (_case, query) => {
    expect(AdminTransactionQuerySchema.safeParse(query).success).toBe(false)
  })
})

describe('TransactionSummaryQuerySchema', () => {
  it('khoảng ngày không bắt buộc', () => {
    expect(TransactionSummaryQuerySchema.parse({})).toEqual({})
    expect(TransactionSummaryQuerySchema.safeParse({ from: '2026-12-01', to: '2026-11-01' }).success).toBe(false)
  })
})

describe('CompleteRefundBodySchema', () => {
  it('body không bắt buộc, chuỗi rỗng = null', () => {
    expect(CompleteRefundBodySchema.parse(undefined)).toEqual({ referenceNo: null, note: null })
    expect(CompleteRefundBodySchema.parse({ referenceNo: ' FT1 ', note: ' ' })).toEqual({
      referenceNo: 'FT1',
      note: null
    })
  })

  it('từ chối mã tham chiếu quá 50 ký tự', () => {
    expect(CompleteRefundBodySchema.safeParse({ referenceNo: 'a'.repeat(51) }).success).toBe(false)
  })
})
