import { describe, expect, it } from 'vitest'

import {
  AdminReviewQuerySchema,
  CreateReviewBodySchema,
  ModerateReviewBodySchema,
  ProductReviewQuerySchema,
  UpdateReviewBodySchema
} from '@modules/review/dto'

const PRODUCT_ID = '9f1e2d3c-4b5a-4678-9abc-def012345678'

describe('CreateReviewBodySchema', () => {
  it('nhận xét rỗng = null', () => {
    expect(CreateReviewBodySchema.parse({ productId: PRODUCT_ID, rating: 4, comment: '  ' })).toEqual({
      productId: PRODUCT_ID,
      rating: 4,
      comment: null
    })
  })

  it.each([
    ['0 sao', { rating: 0 }],
    ['6 sao', { rating: 6 }],
    ['sao lẻ', { rating: 4.5 }],
    ['sao dạng chuỗi', { rating: '5' }],
    ['thiếu sản phẩm', { productId: undefined }],
    ['nhận xét quá 1000 ký tự', { comment: 'a'.repeat(1001) }]
  ])('từ chối khi %s', (_case, override) => {
    expect(CreateReviewBodySchema.safeParse({ productId: PRODUCT_ID, rating: 5, ...override }).success).toBe(false)
  })
})

describe('UpdateReviewBodySchema', () => {
  it('sửa số sao hoặc nhận xét', () => {
    expect(UpdateReviewBodySchema.parse({ rating: 3 })).toEqual({ rating: 3 })
    expect(UpdateReviewBodySchema.parse({ comment: '' })).toEqual({ comment: null })
  })

  it('từ chối body rỗng', () => {
    expect(UpdateReviewBodySchema.safeParse({}).success).toBe(false)
  })
})

describe('ProductReviewQuerySchema', () => {
  it('lọc theo số sao từ query string', () => {
    expect(ProductReviewQuerySchema.parse({ rating: '5', limit: '5' })).toEqual({ limit: 5, offset: 0, rating: 5 })
    expect(ProductReviewQuerySchema.safeParse({ rating: '6' }).success).toBe(false)
  })
})

describe('AdminReviewQuerySchema', () => {
  it('lọc theo trạng thái và số sao', () => {
    expect(AdminReviewQuerySchema.parse({ status: 'hidden', rating: '1' })).toEqual({
      limit: 12,
      offset: 0,
      status: 'hidden',
      rating: 1
    })
    expect(AdminReviewQuerySchema.safeParse({ status: 'deleted' }).success).toBe(false)
  })
})

describe('ModerateReviewBodySchema', () => {
  it('ẩn, trả lời, xoá phản hồi bằng chuỗi rỗng', () => {
    expect(ModerateReviewBodySchema.parse({ isHidden: true })).toEqual({ isHidden: true })
    expect(ModerateReviewBodySchema.parse({ adminReply: ' Cảm ơn ' })).toEqual({ adminReply: 'Cảm ơn' })
    expect(ModerateReviewBodySchema.parse({ adminReply: '' })).toEqual({ adminReply: null })
  })

  it('từ chối body rỗng và phản hồi quá dài', () => {
    expect(ModerateReviewBodySchema.safeParse({}).success).toBe(false)
    expect(ModerateReviewBodySchema.safeParse({ adminReply: 'a'.repeat(1001) }).success).toBe(false)
  })
})
