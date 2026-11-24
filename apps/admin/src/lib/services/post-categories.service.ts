import { http } from '../axios'
import type { PostCategoryItem, PostCategoryPayload } from '../types'

// US-21: Quản lý danh mục bài viết
export async function list(): Promise<PostCategoryItem[]> {
  const { data } = await http.get<PostCategoryItem[]>('/admin/post-categories')
  return data
}

export async function create(payload: PostCategoryPayload): Promise<PostCategoryItem> {
  const { data } = await http.post<PostCategoryItem>('/admin/post-categories', payload)
  return data
}

export async function update(id: string, payload: Partial<PostCategoryPayload>): Promise<PostCategoryItem> {
  const { data } = await http.patch<PostCategoryItem>(`/admin/post-categories/${id}`, payload)
  return data
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/admin/post-categories/${id}`)
}

export const postCategoriesService = {
  list,
  create,
  update,
  remove
}
