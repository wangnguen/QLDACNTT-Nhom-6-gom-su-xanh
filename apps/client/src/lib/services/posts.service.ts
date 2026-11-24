import { http } from '../axios'
import type { Paginated, PostCategoryItem, PostDetail, PostQuery, PostSummary } from '../types'

// US-23: Xem tin tức / blog (không cần đăng nhập)
export async function categories(): Promise<PostCategoryItem[]> {
  const { data } = await http.get<PostCategoryItem[]>('/post-categories')
  return data
}

export async function list(query: PostQuery): Promise<Paginated<PostSummary>> {
  const { data } = await http.get<Paginated<PostSummary>>('/posts', { params: query })
  return data
}

export async function getBySlug(slug: string): Promise<PostDetail> {
  const { data } = await http.get<PostDetail>(`/posts/${slug}`)
  return data
}

export const postsService = {
  categories,
  list,
  getBySlug
}
