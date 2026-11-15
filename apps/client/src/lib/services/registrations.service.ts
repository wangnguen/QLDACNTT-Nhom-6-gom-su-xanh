import { http } from '../axios'
import type { CreateRegistrationRequest, WorkshopRegistration } from '../types'

// US-12: Đăng ký lớp workshop (cần đăng nhập)
export async function register(payload: CreateRegistrationRequest): Promise<WorkshopRegistration> {
  const { data } = await http.post<WorkshopRegistration>('/workshop-registrations', payload)
  return data
}

export const registrationsService = {
  register
}
