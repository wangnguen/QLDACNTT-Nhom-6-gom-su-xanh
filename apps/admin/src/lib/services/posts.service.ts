import { http } from '../axios'
import type { AdminPostQuery, Paginated, PostDetail, PostPayload, PostSummary } from '../types'

// US-22: Quản lý bài viết
export async function list(query: AdminPostQuery): Promise<Paginated<PostSummary>> {
  const { data } = await http.get<Paginated<PostSummary>>('/admin/posts', { params: query })
  return data
}

export async function get(id: string): Promise<PostDetail> {
  const { data } = await http.get<PostDetail>(`/admin/posts/${id}`)
  return data
}

export async function create(payload: PostPayload): Promise<PostDetail> {
  const { data } = await http.post<PostDetail>('/admin/posts', payload)
  return data
}

export async function update(id: string, payload: Partial<PostPayload>): Promise<PostDetail> {
  const { data } = await http.patch<PostDetail>(`/admin/posts/${id}`, payload)
  return data
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/admin/posts/${id}`)
}

export const postsService = {
  list,
  get,
  create,
  update,
  remove
}
