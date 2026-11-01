import { http } from '../axios'
import type { Cart } from '../types'

// US-10: Quản lý giỏ hàng — mọi thao tác đều trả về cả giỏ hàng mới
export async function get(): Promise<Cart> {
  const { data } = await http.get<Cart>('/cart')
  return data
}

export async function addItem(productId: string, quantity: number): Promise<Cart> {
  const { data } = await http.post<Cart>('/cart/items', { productId, quantity })
  return data
}

export async function updateItem(productId: string, quantity: number): Promise<Cart> {
  const { data } = await http.patch<Cart>(`/cart/items/${productId}`, { quantity })
  return data
}

export async function removeItem(productId: string): Promise<Cart> {
  const { data } = await http.delete<Cart>(`/cart/items/${productId}`)
  return data
}

export async function clear(): Promise<Cart> {
  const { data } = await http.delete<Cart>('/cart')
  return data
}

export const cartService = {
  get,
  addItem,
  updateItem,
  removeItem,
  clear
}
