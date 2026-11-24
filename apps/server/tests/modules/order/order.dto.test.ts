import { describe, expect, it } from 'vitest'

import {
  AdminOrderQuerySchema,
  CancelOrderBodySchema,
  CreateOrderBodySchema,
  MyOrderQuerySchema,
  UpdateOrderStatusBodySchema
} from '@modules/order/dto'

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

describe('CancelOrderBodySchema', () => {
  it('body rỗng hoặc không gửi body đều được, lý do rỗng = null', () => {
    expect(CancelOrderBodySchema.parse(undefined)).toEqual({ reason: null })
    expect(CancelOrderBodySchema.parse({ reason: '  ' })).toEqual({ reason: null })
    expect(CancelOrderBodySchema.parse({ reason: 'Đặt nhầm' })).toEqual({ reason: 'Đặt nhầm' })
  })

  it('từ chối lý do quá 255 ký tự', () => {
    expect(CancelOrderBodySchema.safeParse({ reason: 'a'.repeat(256) }).success).toBe(false)
  })
})

describe('AdminOrderQuerySchema', () => {
  it('nhận đủ bộ lọc, ô tìm kiếm rỗng thì bỏ qua', () => {
    expect(
      AdminOrderQuerySchema.parse({
        search: '  ',
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'vnpay',
        from: '2026-11-01',
        to: '2026-11-30'
      })
    ).toEqual({
      limit: 12,
      offset: 0,
      search: undefined,
      status: 'pending',
      paymentStatus: 'paid',
      paymentMethod: 'vnpay',
      from: '2026-11-01',
      to: '2026-11-30'
    })
  })

  it.each([
    ['ngày sai định dạng', { from: '01/11/2026' }],
    ['từ ngày sau đến ngày', { from: '2026-12-01', to: '2026-11-30' }],
    ['tình trạng thanh toán lạ', { paymentStatus: 'partial' }]
  ])('từ chối khi %s', (_case, query) => {
    expect(AdminOrderQuerySchema.safeParse(query).success).toBe(false)
  })
})

describe('UpdateOrderStatusBodySchema', () => {
  it.each(['confirmed', 'cancelled'])('nhận trạng thái %s', (status) => {
    expect(UpdateOrderStatusBodySchema.safeParse({ status }).success).toBe(true)
  })

  it('giao hàng không đổi ở đây', () => {
    expect(UpdateOrderStatusBodySchema.safeParse({ status: 'shipping' }).success).toBe(false)
    expect(UpdateOrderStatusBodySchema.safeParse({ status: 'pending' }).success).toBe(false)
  })
})
