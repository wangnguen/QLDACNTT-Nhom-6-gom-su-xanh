import { describe, expect, it } from 'vitest'

import { CreateReviewBodySchema } from '@modules/review/dto'

describe('SCRUM-163: biên nhận xét theo DTO hiện tại', () => {
  const productId = '9f1e2d3c-4b5a-4678-9abc-def012345678'

  it('nhận comment 1000 ký tự và từ chối 1001 ký tự', () => {
    expect(CreateReviewBodySchema.safeParse({ productId, rating: 1, comment: 'a'.repeat(1000) }).success).toBe(true)
    expect(CreateReviewBodySchema.safeParse({ productId, rating: 5, comment: 'a'.repeat(1001) }).success).toBe(false)
  })
})
