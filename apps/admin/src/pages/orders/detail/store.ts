import { create } from 'zustand'
import { toast } from 'sonner'
import { ordersService, ApiError, type AdminOrderDetail, type OrderAction } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

const SUCCESS: Record<OrderAction, string> = {
  confirmed: 'Đã xác nhận đơn',
  cancelled: 'Đã huỷ đơn'
}

interface OrderDetailState {
  order: AdminOrderDetail | null
  loading: boolean
  loadError: string
  updating: boolean

  fetch: (id: string) => Promise<void>
  // Trả về true khi đổi trạng thái thành công
  updateStatus: (action: OrderAction, reason?: string) => Promise<boolean>
  // Dùng chung cho các thao tác khác trả về đơn mới (vd vận chuyển)
  run: (action: () => Promise<AdminOrderDetail>, success: string, fallback: string) => Promise<boolean>
}

// US-18: Chi tiết đơn hàng (admin)
export const useOrderDetailStore = create<OrderDetailState>((set, get) => ({
  order: null,
  loading: false,
  loadError: '',
  updating: false,

  fetch: async (id) => {
    set((state) => ({ loading: true, loadError: '', order: state.order?.id === id ? state.order : null }))
    try {
      set({ order: await ordersService.get(id) })
    } catch (err) {
      set({ loadError: errorMessage(err, 'Không tải được đơn hàng') })
    } finally {
      set({ loading: false })
    }
  },

  updateStatus: (action, reason) => {
    const order = get().order
    if (!order) return Promise.resolve(false)
    return get().run(
      () => ordersService.updateStatus(order.id, action, reason?.trim() || null),
      `${SUCCESS[action]} ${order.code}`,
      'Không đổi được trạng thái đơn'
    )
  },

  run: async (action, success, fallback) => {
    const order = get().order
    set({ updating: true })
    try {
      set({ order: await action() })
      toast.success(success)
      return true
    } catch (err) {
      toast.error(errorMessage(err, fallback))
      // Đơn có thể vừa bị khách huỷ / đổi — tải lại để hiện đúng trạng thái
      if (order && err instanceof ApiError && (err.status === 409 || err.status === 400)) await get().fetch(order.id)
      return false
    } finally {
      set({ updating: false })
    }
  }
}))
