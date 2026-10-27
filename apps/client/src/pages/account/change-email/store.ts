import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import type { ChangeEmailInput, VerifyChangeEmailInput } from '@lib/schemas/account'

export type ChangeEmailStep = 'form' | 'verify'

interface ChangeEmailState {
  step: ChangeEmailStep
  // Giữ trong bộ nhớ để "Gửi lại mã" không bắt nhập lại mật khẩu — xoá khi quay lại bước 1 hoặc rời trang
  pending: ChangeEmailInput | null
  loading: boolean
  resending: boolean
  error: string

  request: (data: ChangeEmailInput) => Promise<boolean>
  verify: (data: VerifyChangeEmailInput, onSuccess: () => void) => Promise<void>
  resend: () => Promise<boolean>
  back: () => void
  reset: () => void
}

export const useChangeEmailStore = create<ChangeEmailState>((set, get) => ({
  step: 'form',
  pending: null,
  loading: false,
  resending: false,
  error: '',

  request: async (data) => {
    set({ error: '', loading: true })
    try {
      await authService.requestChangeEmail(data)
      set({ step: 'verify', pending: data })
      return true
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Không gửi được mã xác nhận' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  verify: async (data, onSuccess) => {
    set({ error: '', loading: true })
    try {
      const user = await authService.verifyChangeEmail(data)
      useAuthStore.getState().setUser(user)
      toast.success('Đổi email thành công. Từ giờ hãy đăng nhập bằng email mới')
      onSuccess()
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Xác nhận đổi email thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  resend: async () => {
    const { pending } = get()
    if (!pending) return false
    set({ error: '', resending: true })
    try {
      await authService.requestChangeEmail(pending)
      toast.success('Đã gửi lại mã xác nhận')
      return true
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Không gửi lại được mã' })
      return false
    } finally {
      set({ resending: false })
    }
  },

  back: () => set({ step: 'form', pending: null, error: '' }),

  reset: () => set({ step: 'form', pending: null, loading: false, resending: false, error: '' })
}))
