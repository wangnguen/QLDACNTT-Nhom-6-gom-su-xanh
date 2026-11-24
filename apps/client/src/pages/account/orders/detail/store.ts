import { create } from 'zustand'
import { toast } from 'sonner'
import { ordersService, ApiError, type OrderDetail } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface OrderDetailState {
  order: OrderDetail | null
  loading: boolean
  error: string
  paying: boolean
  cancelling: boolean

  fetch: (id: string) => Promise<void>
  // Tạo link thanh toán mới rồi chuyển sang cổng thanh toán
  pay: (order: OrderDetail) => Promise<void>
  // Trả về true khi huỷ thành công
  cancel: (order: OrderDetail, reason: string) => Promise<boolean>
}

// US-15: Chi tiết đơn hàng
export const useOrderDetailStore = create<OrderDetailState>((set) => ({
  order: null,
  loading: false,
  error: '',
  paying: false,
  cancelling: false,

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
  },

  // US-16: Huỷ đơn hàng — sản phẩm được trả lại kho, đơn đã thanh toán chờ cửa hàng hoàn tiền
  cancel: async (order, reason) => {
    set({ cancelling: true })
    try {
      const updated = await ordersService.cancel(order.id, reason.trim() || null)
      set({ order: updated })
      toast.success(
        updated.paymentStatus === 'refund_pending'
          ? `Đã huỷ đơn ${order.code}. Cửa hàng sẽ hoàn tiền cho bạn trong 3–5 ngày làm việc`
          : `Đã huỷ đơn ${order.code}`
      )
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Huỷ đơn hàng thất bại'))
      // Đơn có thể vừa được cửa hàng xác nhận — tải lại để hiện đúng trạng thái
      await useOrderDetailStore.getState().fetch(order.id)
      return false
    } finally {
      set({ cancelling: false })
    }
  }
}))
