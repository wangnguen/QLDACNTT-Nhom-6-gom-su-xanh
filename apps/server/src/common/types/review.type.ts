import { Paginated } from './response.type'

export type ReviewItem = {
  id: string
  rating: number
  comment: string | null
  // Tên người đánh giá (tài khoản)
  authorName: string
  createdAt: Date
  updatedAt: Date
  adminReply: string | null
  repliedAt: Date | null
}

export type RatingSummary = {
  // Điểm trung bình, làm tròn 1 chữ số thập phân; 0 khi chưa có đánh giá
  average: number
  count: number
  // Số đánh giá theo từng mức sao
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export type ProductReviews = Paginated<ReviewItem> & {
  summary: RatingSummary
}

// Khách xem mình đã / được đánh giá sản phẩm chưa
export type MyReviewStatus = {
  canReview: boolean
  // Lý do chưa đánh giá được, vd "Chỉ khách đã nhận hàng mới đánh giá được"
  reason: string | null
  review: (ReviewItem & { isHidden: boolean }) | null
}

// US-25: Đánh giá ở trang admin — kèm sản phẩm, khách và đơn đã mua
export type AdminReviewItem = ReviewItem & {
  isHidden: boolean
  product: { id: string; name: string; slug: string; imageUrl: string | null }
  customer: { id: string; fullName: string; email: string }
  orderCode: string | null
}
