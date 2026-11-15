import { http } from '../axios'
import type { Paginated, WorkshopDetail, WorkshopQuery, WorkshopSummary } from '../types'

// US-12: Xem danh sách lớp workshop sắp diễn ra (không cần đăng nhập)
export async function list(query: WorkshopQuery): Promise<Paginated<WorkshopSummary>> {
  const { data } = await http.get<Paginated<WorkshopSummary>>('/workshops', { params: query, skipAuth: true })
  return data
}

// US-12: Chi tiết lớp — lớp đang ẩn hoặc không tồn tại trả 404
export async function getBySlug(slug: string): Promise<WorkshopDetail> {
  const { data } = await http.get<WorkshopDetail>(`/workshops/${encodeURIComponent(slug)}`, { skipAuth: true })
  return data
}

export const workshopsService = {
  list,
  getBySlug
}
