import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import type { ResetPasswordInput } from '@lib/schemas/auth'

export type ResetPasswordStep = 'form' | 'done'

interface ResetPasswordState {
  step: ResetPasswordStep
  loading: boolean
  resending: boolean
  error: string

  submit: (data: ResetPasswordInput) => Promise<void>
  resend: (email: string) => Promise<boolean>
  reset: () => void
}

export const useResetPasswordStore = create<ResetPasswordState>((set) => ({
  step: 'form',
  loading: false,
  resending: false,
  error: '',

  submit: async (data) => {
    set({ error: '', loading: true })
    try {
      await authService.resetPassword(data)
      // Server đã thu hồi mọi phiên đăng nhập của tài khoản → xoá phiên trên trình duyệt này (nếu có)
      if (useAuthStore.getState().isAuthenticated) await useAuthStore.getState().logout()
      set({ step: 'done' })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Đặt lại mật khẩu thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  resend: async (email) => {
    set({ error: '', resending: true })
    try {
      await authService.forgotPassword({ email })
      toast.success('Nếu email đã đăng ký, mã OTP mới đã được gửi')
      return true
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Không gửi lại được mã' })
      return false
    } finally {
      set({ resending: false })
    }
  },

  reset: () => set({ step: 'form', loading: false, resending: false, error: '' })
}))
