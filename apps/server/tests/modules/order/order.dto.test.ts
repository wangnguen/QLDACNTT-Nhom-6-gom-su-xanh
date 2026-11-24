import { describe, expect, it } from 'vitest'

import { CreateOrderBodySchema, MyOrderQuerySchema } from '@modules/order/dto'

const validBody = {
  recipientName: ' Nguyễn Văn An ',
  recipientPhone: '0912345678',
  shippingAddress: ' 12 Bát Tràng, Gia Lâm, Hà Nội ',
  paymentMethod: 'cod'
}

describe('CreateOrderBodySchema', () => {
  it('cắt khoảng trắng, ghi chú rỗng = null', () => {
    expect(CreateOrderBodySchema.parse({ ...validBody, note: '  ' })).toEqual({
      recipientName: 'Nguyễn Văn An',
      recipientPhone: '0912345678',
      shippingAddress: '12 Bát Tràng, Gia Lâm, Hà Nội',
      paymentMethod: 'cod',
      note: null
    })
  })

  it('nhận thanh toán VNPay', () => {
    expect(CreateOrderBodySchema.safeParse({ ...validBody, paymentMethod: 'vnpay' }).success).toBe(true)
  })

  it.each([
    ['thiếu tên người nhận', { recipientName: '' }],
    ['số điện thoại sai', { recipientPhone: '12345' }],
    ['địa chỉ quá ngắn', { shippingAddress: 'Hà Nội' }],
    ['địa chỉ quá 255 ký tự', { shippingAddress: 'a'.repeat(256) }],
    ['phương thức thanh toán lạ', { paymentMethod: 'momo' }],
    ['thiếu phương thức thanh toán', { paymentMethod: undefined }],
    ['ghi chú quá 500 ký tự', { note: 'a'.repeat(501) }]
  ])('từ chối khi %s', (_case, override) => {
    expect(CreateOrderBodySchema.safeParse({ ...validBody, ...override }).success).toBe(false)
  })
})

describe('MyOrderQuerySchema', () => {
  it('mặc định trang đầu, lọc theo trạng thái', () => {
    expect(MyOrderQuerySchema.parse({ status: 'shipping' })).toEqual({ limit: 12, offset: 0, status: 'shipping' })
  })

  it('từ chối trạng thái lạ', () => {
    expect(MyOrderQuerySchema.safeParse({ status: 'done' }).success).toBe(false)
  })
})
