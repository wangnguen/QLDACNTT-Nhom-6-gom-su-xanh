import { http } from '../axios'
import type { AdminOrder, AdminOrderDetail, AdminOrderQuery, OrderAction, OrderStatus, Paginated } from '../types'

// US-18: Quản lý đơn hàng
export async function list(query: AdminOrderQuery): Promise<Paginated<AdminOrder>> {
  const { data } = await http.get<Paginated<AdminOrder>>('/admin/orders', { params: query })
  return data
}

// Số đơn của từng trạng thái (tab đếm)
export async function statusCounts(): Promise<Record<OrderStatus, number>> {
  const { data } = await http.get<Record<OrderStatus, number>>('/admin/orders/status-counts')
  return data
}

export async function get(id: string): Promise<AdminOrderDetail> {
  const { data } = await http.get<AdminOrderDetail>(`/admin/orders/${id}`)
  return data
}

// Xác nhận / huỷ (kèm lý do khách sẽ thấy)
export async function updateStatus(
  id: string,
  status: OrderAction,
  cancelReason?: string | null
): Promise<AdminOrderDetail> {
  const { data } = await http.patch<AdminOrderDetail>(`/admin/orders/${id}/status`, { status, cancelReason })
  return data
}

export const ordersService = {
  list,
  statusCounts,
  get,
  updateStatus
}
