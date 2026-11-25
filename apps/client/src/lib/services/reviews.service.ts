import { http } from '../axios'
import type { MyReviewStatus, ProductReviews, ReviewItem } from '../types'

// US-24: Đánh giá của sản phẩm (không cần đăng nhập), lọc theo số sao
export async function listForProduct(
  slug: string,
  query: { limit?: number; offset?: number; rating?: number }
): Promise<ProductReviews> {
  const { data } = await http.get<ProductReviews>(`/products/${slug}/reviews`, { params: query })
  return data
}

// Đã đánh giá chưa / có được đánh giá không (cần đăng nhập)
export async function getMine(slug: string): Promise<MyReviewStatus> {
  const { data } = await http.get<MyReviewStatus>(`/products/${slug}/reviews/me`)
  return data
}

export async function create(productId: string, rating: number, comment: string | null): Promise<ReviewItem> {
  const { data } = await http.post<ReviewItem>('/reviews', { productId, rating, comment })
  return data
}

export async function update(id: string, rating: number, comment: string | null): Promise<ReviewItem> {
  const { data } = await http.patch<ReviewItem>(`/reviews/${id}`, { rating, comment })
  return data
}

export const reviewsService = {
  listForProduct,
  getMine,
  create,
  update
}
