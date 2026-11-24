import { http } from '../axios'
import type { CheckoutRequest, CheckoutResult, MyOrderQuery, OrderDetail, Paginated } from '../types'

// US-14: Đặt hàng từ giỏ hàng — đơn VNPay trả kèm link sang cổng thanh toán
export async function checkout(payload: CheckoutRequest): Promise<CheckoutResult> {
  const { data } = await http.post<CheckoutResult>('/orders', payload)
  return data
}

// US-14: Thanh toán lại đơn VNPay chưa trả tiền
export async function pay(id: string): Promise<{ paymentUrl: string }> {
  const { data } = await http.post<{ paymentUrl: string }>(`/orders/${id}/payment`)
  return data
}

// US-15: Đơn hàng của tôi — mới đặt lên trước
export async function listMine(query: MyOrderQuery): Promise<Paginated<OrderDetail>> {
  const { data } = await http.get<Paginated<OrderDetail>>('/orders', { params: query })
  return data
}

export async function get(id: string): Promise<OrderDetail> {
  const { data } = await http.get<OrderDetail>(`/orders/${id}`)
  return data
}

export const ordersService = {
  checkout,
  pay,
  listMine,
  get
}
