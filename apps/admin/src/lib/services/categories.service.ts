import { http } from '../axios'
import type { CategoryItem, CategoryPayload } from '../types'

// US-07: Quản lý danh mục
export async function list(): Promise<CategoryItem[]> {
  const { data } = await http.get<CategoryItem[]>('/admin/categories')
  return data
}

export async function create(payload: CategoryPayload): Promise<CategoryItem> {
  const { data } = await http.post<CategoryItem>('/admin/categories', payload)
  return data
}

export async function update(id: string, payload: Partial<CategoryPayload>): Promise<CategoryItem> {
  const { data } = await http.patch<CategoryItem>(`/admin/categories/${id}`, payload)
  return data
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/admin/categories/${id}`)
}

export const categoriesService = {
  list,
  create,
  update,
  remove
}
