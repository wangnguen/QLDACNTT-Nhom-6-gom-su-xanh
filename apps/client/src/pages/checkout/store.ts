import { create } from 'zustand'
import {
  ordersService,
  paymentsService,
  ApiError,
  type CheckoutRequest,
  type CheckoutResult,
  type PaymentMethodOption
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface CheckoutState {
  methods: PaymentMethodOption[]
  submitting: boolean
  submitError: string

  fetchMethods: () => Promise<void>
  // Trả về kết quả khi đặt hàng thành công
  checkout: (payload: CheckoutRequest) => Promise<CheckoutResult | null>
  reset: () => void
}

// Mặc định khi chưa tải được danh sách phương thức: luôn nhận COD
const DEFAULT_METHODS: PaymentMethodOption[] = [{ method: 'cod', enabled: true, sandbox: false }]

// US-14: Đặt hàng và thanh toán
export const useCheckoutStore = create<CheckoutState>((set) => ({
  methods: DEFAULT_METHODS,
  submitting: false,
  submitError: '',

  fetchMethods: async () => {
    try {
      set({ methods: await paymentsService.methods() })
    } catch {
      set({ methods: DEFAULT_METHODS })
    }
  },

  checkout: async (payload) => {
    set({ submitting: true, submitError: '' })
    try {
      return await ordersService.checkout(payload)
    } catch (err) {
      set({ submitError: errorMessage(err, 'Đặt hàng thất bại, vui lòng thử lại') })
      return null
    } finally {
      set({ submitting: false })
    }
  },

  reset: () => set({ submitting: false, submitError: '' })
}))
