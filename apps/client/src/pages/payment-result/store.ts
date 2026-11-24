import { create } from 'zustand'
import { ordersService, paymentsService, ApiError, type PaymentResult } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface PaymentResultState {
  result: PaymentResult | null
  loading: boolean
  error: string
  retrying: boolean

  confirm: (search: string) => Promise<void>
  // Tạo link thanh toán mới rồi chuyển sang cổng thanh toán
  retry: (orderId: string) => Promise<void>
  reset: () => void
}

// Trình duyệt có thể gọi effect hai lần (StrictMode) — chỉ gửi một lần cho mỗi query
let confirmedSearch = ''

// US-14: Kết quả thanh toán khi khách quay về từ cổng thanh toán
export const usePaymentResultStore = create<PaymentResultState>((set) => ({
  result: null,
  loading: false,
  error: '',
  retrying: false,

  confirm: async (search) => {
    if (confirmedSearch === search) return
    confirmedSearch = search
    set({ loading: true, error: '', result: null })
    try {
      set({ result: await paymentsService.confirmReturn(search) })
    } catch (err) {
      set({ error: errorMessage(err, 'Không kiểm tra được kết quả thanh toán') })
    } finally {
      set({ loading: false })
    }
  },

  retry: async (orderId) => {
    set({ retrying: true, error: '' })
    try {
      const { paymentUrl } = await ordersService.pay(orderId)
      window.location.assign(paymentUrl)
    } catch (err) {
      set({ retrying: false, error: errorMessage(err, 'Không tạo được lượt thanh toán mới') })
    }
  },

  reset: () => {
    confirmedSearch = ''
    set({ result: null, loading: false, error: '', retrying: false })
  }
}))
