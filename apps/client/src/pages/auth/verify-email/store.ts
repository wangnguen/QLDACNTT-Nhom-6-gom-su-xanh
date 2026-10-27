import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError } from '@lib/api'
import type { VerifyEmailInput } from '@lib/schemas/auth'

interface VerifyEmailState {
  loading: boolean
  resending: boolean
  error: string

  submit: (data: VerifyEmailInput, onSuccess: () => void) => Promise<void>
  resend: (email: string) => Promise<boolean>
  reset: () => void
}

export const useVerifyEmailStore = create<VerifyEmailState>((set) => ({
  loading: false,
  resending: false,
  error: '',

  submit: async (data, onSuccess) => {
    set({ error: '', loading: true })
    try {
      await authService.verifyEmail(data)
      toast.success('Xác thực email thành công! Mời bạn đăng nhập')
      onSuccess()
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Xác thực thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  resend: async (email) => {
    set({ error: '', resending: true })
    try {
      await authService.resendVerification({ email })
      toast.success('Nếu email chưa được xác thực, mã OTP mới đã được gửi')
      return true
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Không gửi lại được mã' })
      return false
    } finally {
      set({ resending: false })
    }
  },

  reset: () => set({ loading: false, resending: false, error: '' })
}))
