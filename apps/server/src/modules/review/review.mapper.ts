import { MAX_RATING, MIN_RATING } from '@common/constants'
import { AdminReviewItem, RatingSummary, ReviewItem } from '@common/types'

import { ProductReview } from '@entities/product-review.entity'

// `review.user` phải được load kèm
export const toReviewItem = (review: ProductReview): ReviewItem => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  authorName: review.user.fullName,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  adminReply: review.adminReply,
  repliedAt: review.repliedAt
})

// `counts`: số đánh giá theo từng mức sao (mức không có đánh giá thì không có trong Map)
export const toRatingSummary = (counts: Map<number, number>): RatingSummary => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (let star = MIN_RATING; star <= MAX_RATING; star++) {
    distribution[star as keyof typeof distribution] = counts.get(star) ?? 0
  }
  const count = Object.values(distribution).reduce((sum, n) => sum + n, 0)
  const total = Object.entries(distribution).reduce((sum, [star, n]) => sum + Number(star) * n, 0)
  return { average: count ? Math.round((total / count) * 10) / 10 : 0, count, distribution }
}

// `review.user`, `review.product` phải được load kèm; `review.order` nếu có
export const toAdminReviewItem = (review: ProductReview): AdminReviewItem => ({
  ...toReviewItem(review),
  isHidden: review.isHidden,
  product: {
    id: review.product.id,
    name: review.product.name,
    slug: review.product.slug,
    imageUrl: review.product.imageUrls[0] ?? null
  },
  customer: { id: review.user.id, fullName: review.user.fullName, email: review.user.email },
  orderCode: review.order?.code ?? null
})
