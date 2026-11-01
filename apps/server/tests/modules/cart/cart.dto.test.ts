import { describe, expect, it } from 'vitest'

import { AddCartItemBodySchema, CartProductParamSchema, UpdateCartItemBodySchema } from '@modules/cart/dto'

const PRODUCT_ID = '9f1e2d3c-4b5a-4678-9abc-def012345678'

describe('AddCartItemBodySchema', () => {
  it('mặc định thêm 1 sản phẩm', () => {
    expect(AddCartItemBodySchema.parse({ productId: PRODUCT_ID })).toEqual({ productId: PRODUCT_ID, quantity: 1 })
  })

  it.each([
    ['thiếu sản phẩm', {}],
    ['productId không phải UUID', { productId: 'abc' }],
    ['số lượng 0', { productId: PRODUCT_ID, quantity: 0 }],
    ['số lượng lẻ', { productId: PRODUCT_ID, quantity: 1.5 }],
    ['số lượng quá 99', { productId: PRODUCT_ID, quantity: 100 }],
    ['số lượng là chuỗi', { productId: PRODUCT_ID, quantity: '2' }]
  ])('từ chối khi %s', (_case, body) => {
    expect(AddCartItemBodySchema.safeParse(body).success).toBe(false)
  })
})

describe('UpdateCartItemBodySchema', () => {
  it('bắt buộc gửi số lượng từ 1 đến 99', () => {
    expect(UpdateCartItemBodySchema.parse({ quantity: 99 })).toEqual({ quantity: 99 })
    expect(UpdateCartItemBodySchema.safeParse({}).success).toBe(false)
    expect(UpdateCartItemBodySchema.safeParse({ quantity: 0 }).success).toBe(false)
  })
})

describe('CartProductParamSchema', () => {
  it('chỉ nhận UUID', () => {
    expect(CartProductParamSchema.safeParse({ productId: PRODUCT_ID }).success).toBe(true)
    expect(CartProductParamSchema.safeParse({ productId: 'binh-hoa' }).success).toBe(false)
  })
})
