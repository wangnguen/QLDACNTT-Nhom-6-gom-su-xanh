import { http } from '../axios'
import type { AdminReview, AdminReviewQuery, Paginated } from '../types'

// US-25: Quản lý đánh giá
export async function list(query: AdminReviewQuery): Promise<Paginated<AdminReview>> {
  const { data } = await http.get<Paginated<AdminReview>>('/admin/reviews', { params: query })
  return data
}

// Ẩn / hiện đánh giá hoặc trả lời khách (null để xoá phản hồi)
export async function moderate(
  id: string,
  payload: { isHidden?: boolean; adminReply?: string | null }
): Promise<AdminReview> {
  const { data } = await http.patch<AdminReview>(`/admin/reviews/${id}`, payload)
  return data
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/admin/reviews/${id}`)
}

export const reviewsService = {
  list,
  moderate,
  remove
}
