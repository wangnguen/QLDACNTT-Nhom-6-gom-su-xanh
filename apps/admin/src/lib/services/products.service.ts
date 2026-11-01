import { http } from '../axios'
import type { AdminProductQuery, Paginated, ProductDetail, ProductPayload, ProductSummary } from '../types'

// US-07: Quản lý sản phẩm
export async function list(query: AdminProductQuery): Promise<Paginated<ProductSummary>> {
  const { data } = await http.get<Paginated<ProductSummary>>('/admin/products', { params: query })
  return data
}

export async function get(id: string): Promise<ProductDetail> {
  const { data } = await http.get<ProductDetail>(`/admin/products/${id}`)
  return data
}

export async function create(payload: ProductPayload): Promise<ProductDetail> {
  const { data } = await http.post<ProductDetail>('/admin/products', payload)
  return data
}

export async function update(id: string, payload: Partial<ProductPayload>): Promise<ProductDetail> {
  const { data } = await http.patch<ProductDetail>(`/admin/products/${id}`, payload)
  return data
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/admin/products/${id}`)
}

export const productsService = {
  list,
  get,
  create,
  update,
  remove
}
