import { describe, expect, it } from 'vitest'

import { MyTransactionQuerySchema } from '@modules/payment/dto'

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
