import { create } from 'zustand'
import { ordersService, ApiError, type OrderDetail } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface OrderDetailState {
  order: OrderDetail | null
  loading: boolean
  error: string
  paying: boolean

  fetch: (id: string) => Promise<void>
  // Tạo link thanh toán mới rồi chuyển sang cổng thanh toán
  pay: (order: OrderDetail) => Promise<void>
}

// US-15: Chi tiết đơn hàng
export const useOrderDetailStore = create<OrderDetailState>((set) => ({
  order: null,
  loading: false,
  error: '',
  paying: false,

  fetch: async (id) => {
    set((state) => ({ loading: true, error: '', order: state.order?.id === id ? state.order : null }))
    try {
      set({ order: await ordersService.get(id) })
    } catch (err) {
      set({ error: errorMessage(err, 'Không tải được đơn hàng') })
    } finally {
      set({ loading: false })
    }
  },

  pay: async (order) => {
    set({ paying: true, error: '' })
    try {
      const { paymentUrl } = await ordersService.pay(order.id)
      window.location.assign(paymentUrl)
    } catch (err) {
      set({ paying: false, error: errorMessage(err, 'Không tạo được lượt thanh toán mới') })
    }
  }
}))
