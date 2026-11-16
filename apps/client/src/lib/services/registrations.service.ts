import { http } from '../axios'
import type { CreateRegistrationRequest, MyRegistrationQuery, Paginated, WorkshopRegistration } from '../types'

// US-12: Đăng ký lớp workshop (cần đăng nhập)
export async function register(payload: CreateRegistrationRequest): Promise<WorkshopRegistration> {
  const { data } = await http.post<WorkshopRegistration>('/workshop-registrations', payload)
  return data
}

// US-13: Lịch workshop của tôi — mới đăng ký lên trước
export async function listMine(query: MyRegistrationQuery): Promise<Paginated<WorkshopRegistration>> {
  const { data } = await http.get<Paginated<WorkshopRegistration>>('/workshop-registrations', { params: query })
  return data
}

// US-13: Tự huỷ (trước giờ học 24 tiếng)
export async function cancel(id: string, reason: string | null): Promise<WorkshopRegistration> {
  const { data } = await http.patch<WorkshopRegistration>(`/workshop-registrations/${id}/cancel`, { reason })
  return data
}

export const registrationsService = {
  register,
  listMine,
  cancel
}
