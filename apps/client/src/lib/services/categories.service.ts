import { http } from '../axios'
import type { CategoryItem } from '../types'

// US-08: Danh mục đang hiện (bộ lọc trang sản phẩm)
export async function list(): Promise<CategoryItem[]> {
  const { data } = await http.get<CategoryItem[]>('/categories', { skipAuth: true })
  return data
}

export const categoriesService = {
  list
}
