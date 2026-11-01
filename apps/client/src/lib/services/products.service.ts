import { http } from '../axios'
import type { Paginated, ProductDetail, ProductQuery, ProductSummary } from '../types'

// US-08: Xem danh sách sản phẩm (không cần đăng nhập)
export async function list(query: ProductQuery): Promise<Paginated<ProductSummary>> {
  const { data } = await http.get<Paginated<ProductSummary>>('/products', { params: query, skipAuth: true })
  return data
}

// US-09: Xem chi tiết sản phẩm — sản phẩm đang ẩn hoặc không tồn tại trả 404
export async function getBySlug(slug: string): Promise<ProductDetail> {
  const { data } = await http.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { skipAuth: true })
  return data
}

export const productsService = {
  list,
  getBySlug
}
