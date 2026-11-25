import { create } from 'zustand'
import {
  ordersService,
  ApiError,
  type AdminOrder,
  type AdminOrderQuery,
  type OrderStatus,
  type Paginated
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface OrdersState {
  result: Paginated<AdminOrder> | null
  counts: Record<OrderStatus, number> | null
  loading: boolean
  loadError: string

  fetch: (query: AdminOrderQuery) => Promise<void>
  fetchCounts: () => Promise<void>
}

// US-18: Quản lý đơn hàng
export const useOrdersStore = create<OrdersState>((set) => ({
  result: null,
  counts: null,
  loading: false,
  loadError: '',

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, loadError: '' })
    try {
      const result = await ordersService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được danh sách đơn hàng') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchCounts: async () => {
    try {
      set({ counts: await ordersService.statusCounts() })
    } catch {
      // Không có số đếm thì các tab vẫn dùng được
    }
  }
}))
