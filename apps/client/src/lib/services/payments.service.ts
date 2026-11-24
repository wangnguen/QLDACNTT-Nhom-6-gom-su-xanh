import { http } from '../axios'
import type { PaymentMethodOption, PaymentResult } from '../types'

// US-14: Phương thức thanh toán đang nhận
export async function methods(): Promise<PaymentMethodOption[]> {
  const { data } = await http.get<PaymentMethodOption[]>('/payments/methods')
  return data
}

// US-14: Gửi nguyên query cổng thanh toán trả về để server kiểm tra chữ ký và ghi nhận kết quả
export async function confirmReturn(search: string): Promise<PaymentResult> {
  const { data } = await http.get<PaymentResult>(`/payments/vnpay-return${search}`)
  return data
}

export const paymentsService = {
  methods,
  confirmReturn
}
