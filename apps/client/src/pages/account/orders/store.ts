import { create } from 'zustand'
import { ordersService, ApiError, type MyOrderQuery, type OrderDetail, type Paginated } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi tab nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface MyOrdersState {
  result: Paginated<OrderDetail> | null
  loading: boolean
  error: string

  fetch: (query: MyOrderQuery) => Promise<void>
  // Cập nhật một đơn trong danh sách sau khi huỷ / thanh toán
  replace: (order: OrderDetail) => void
}

// US-15: Đơn hàng của tôi
export const useMyOrdersStore = create<MyOrdersState>((set) => ({
  result: null,
  loading: false,
  error: '',

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, error: '' })
    try {
      const result = await ordersService.listMine(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ error: errorMessage(err, 'Không tải được danh sách đơn hàng') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  replace: (order) =>
    set((state) => ({
      result: state.result && {
        ...state.result,
        entries: state.result.entries.map((o) => (o.id === order.id ? order : o))
      }
    }))
}))
