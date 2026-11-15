import { http } from '../axios'
import type { AdminRegistrationQuery, Paginated, RegistrationAction, WorkshopRegistration } from '../types'

// US-13: Quản lý đăng ký workshop
export async function list(query: AdminRegistrationQuery): Promise<Paginated<WorkshopRegistration>> {
  const { data } = await http.get<Paginated<WorkshopRegistration>>('/admin/workshop-registrations', { params: query })
  return data
}

// Xác nhận / check-in / huỷ (kèm lý do khách sẽ thấy)
export async function updateStatus(
  id: string,
  status: RegistrationAction,
  cancelReason?: string | null
): Promise<WorkshopRegistration> {
  const { data } = await http.patch<WorkshopRegistration>(`/admin/workshop-registrations/${id}/status`, {
    status,
    cancelReason
  })
  return data
}

export const registrationsService = {
  list,
  updateStatus
}
