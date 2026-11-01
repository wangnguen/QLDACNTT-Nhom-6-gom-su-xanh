import { create } from 'zustand'
import { toast } from 'sonner'
import { cartService, ApiError, type Cart } from '../lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface CartState {
  cart: Cart | null
  loading: boolean
  // Sản phẩm đang được thêm/sửa/xoá — khoá nút của dòng đó để tránh bấm trùng
  pendingIds: string[]

  fetch: () => Promise<void>
  // Trả về true khi thêm thành công
  addItem: (productId: string, quantity: number) => Promise<boolean>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clear: () => Promise<void>
  reset: () => void
}

// US-10: Giỏ hàng (lưu trên server theo tài khoản) — dùng chung cho header, trang chi tiết và trang giỏ hàng
export const useCartStore = create<CartState>((set, get) => {
  // Chạy một thao tác trên một dòng giỏ hàng, cập nhật giỏ mới từ server; lỗi thì báo bằng toast
  const runOnItem = async (productId: string, action: () => Promise<Cart>, fallback: string) => {
    if (get().pendingIds.includes(productId)) return false
    set((state) => ({ pendingIds: [...state.pendingIds, productId] }))
    try {
      set({ cart: await action() })
      return true
    } catch (err) {
      toast.error(errorMessage(err, fallback))
      return false
    } finally {
      set((state) => ({ pendingIds: state.pendingIds.filter((id) => id !== productId) }))
    }
  }

  return {
    cart: null,
    loading: false,
    pendingIds: [],

    fetch: async () => {
      set({ loading: true })
      try {
        set({ cart: await cartService.get() })
      } catch {
        // Không tải được thì giữ giỏ cũ; trang giỏ hàng có nút tải lại
      } finally {
        set({ loading: false })
      }
    },

    addItem: (productId, quantity) =>
      runOnItem(productId, () => cartService.addItem(productId, quantity), 'Không thêm được vào giỏ hàng'),

    updateQuantity: async (productId, quantity) => {
      await runOnItem(productId, () => cartService.updateItem(productId, quantity), 'Không đổi được số lượng')
    },

    removeItem: async (productId) => {
      await runOnItem(productId, () => cartService.removeItem(productId), 'Không xoá được sản phẩm')
    },

    clear: async () => {
      try {
        set({ cart: await cartService.clear() })
        toast.success('Đã xoá toàn bộ giỏ hàng')
      } catch (err) {
        toast.error(errorMessage(err, 'Không xoá được giỏ hàng'))
      }
    },

    reset: () => set({ cart: null, loading: false, pendingIds: [] })
  }
})
