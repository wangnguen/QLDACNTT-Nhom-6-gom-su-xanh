import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError } from '@lib/api'
import type { ForgotPasswordInput } from '@lib/schemas/auth'

interface ForgotPasswordState {
  loading: boolean
  error: string

  submit: (data: ForgotPasswordInput, onSuccess: () => void) => Promise<void>
  reset: () => void
}

export const useForgotPasswordStore = create<ForgotPasswordState>((set) => ({
  loading: false,
  error: '',

  submit: async (data, onSuccess) => {
    set({ error: '', loading: true })
    try {
      await authService.forgotPassword(data)
      toast.success('Nếu email đã đăng ký, mã OTP đã được gửi tới hộp thư của bạn')
      onSuccess()
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Không gửi được yêu cầu' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '' })
}))
