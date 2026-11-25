import { create } from 'zustand'
import { toast } from 'sonner'
import {
  ordersService,
  ApiError,
  type AdminOrder,
  type AdminOrderQuery,
  type OrderStatus,
  type Paginated,
  type ShipmentBody
} from '@lib/api'
import { SHIPMENT_SUCCESS } from '@components/order'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi tab nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface ShippingState {
  result: Paginated<AdminOrder> | null
  counts: Record<OrderStatus, number> | null
  loading: boolean
  loadError: string
  // Đơn đang được cập nhật vận chuyển
  updatingId: string | null

  fetch: (query: AdminOrderQuery) => Promise<void>
  fetchCounts: () => Promise<void>
  // Trả về true khi thành công; danh sách và số đếm được tải lại vì đơn có thể chuyển sang tab khác
  updateShipment: (order: AdminOrder, body: ShipmentBody, reload: () => void) => Promise<boolean>
}

// US-19: Quản lý vận chuyển
export const useShippingStore = create<ShippingState>((set, get) => ({
  result: null,
  counts: null,
  loading: false,
  loadError: '',
  updatingId: null,

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, loadError: '' })
    try {
      const result = await ordersService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được danh sách đơn cần giao') })
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
  },

  updateShipment: async (order, body, reload) => {
    set({ updatingId: order.id })
    try {
      await ordersService.updateShipment(order.id, body)
      toast.success(`${SHIPMENT_SUCCESS[body.action]} — ${order.code}`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Không cập nhật được vận chuyển'))
      return false
    } finally {
      set({ updatingId: null })
      reload()
      get().fetchCounts()
    }
  }
}))
