import { http } from '../axios'
import type { Paginated, ProductQuery, ProductSummary } from '../types'

// US-08: Xem danh sách sản phẩm (không cần đăng nhập)
export async function list(query: ProductQuery): Promise<Paginated<ProductSummary>> {
  const { data } = await http.get<Paginated<ProductSummary>>('/products', { params: query, skipAuth: true })
  return data
}

export const productsService = {
  list
}
