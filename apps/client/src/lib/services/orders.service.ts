import { http } from '../axios'
import type { CheckoutRequest, CheckoutResult } from '../types'

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

export const ordersService = {
  checkout,
  pay
}
