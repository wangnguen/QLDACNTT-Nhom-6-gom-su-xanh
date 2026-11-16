import { http } from '../axios'
import type { AdminWorkshopQuery, Paginated, WorkshopDetail, WorkshopPayload, WorkshopSummary } from '../types'

// US-11: Quản lý lớp workshop
export async function list(query: AdminWorkshopQuery): Promise<Paginated<WorkshopSummary>> {
  const { data } = await http.get<Paginated<WorkshopSummary>>('/admin/workshops', { params: query })
  return data
}

export async function get(id: string): Promise<WorkshopDetail> {
  const { data } = await http.get<WorkshopDetail>(`/admin/workshops/${id}`)
  return data
}

export async function create(payload: WorkshopPayload): Promise<WorkshopDetail> {
  const { data } = await http.post<WorkshopDetail>('/admin/workshops', payload)
  return data
}

export async function update(id: string, payload: Partial<WorkshopPayload>): Promise<WorkshopDetail> {
  const { data } = await http.patch<WorkshopDetail>(`/admin/workshops/${id}`, payload)
  return data
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/admin/workshops/${id}`)
}

export const workshopsService = {
  list,
  get,
  create,
  update,
  remove
}
