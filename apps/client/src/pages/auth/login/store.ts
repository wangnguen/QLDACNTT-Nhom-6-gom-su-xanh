import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import type { LoginInput } from '@lib/schemas/auth'

interface LoginState {
  loading: boolean
  error: string
  needsVerification: boolean

  submit: (data: LoginInput, onSuccess: () => void) => Promise<void>
  reset: () => void
}

export const useLoginStore = create<LoginState>((set) => ({
  loading: false,
  error: '',
  needsVerification: false,

  submit: async (data, onSuccess) => {
    set({ error: '', needsVerification: false, loading: true })
    try {
      const res = await authService.login(data)
      useAuthStore.getState().setAuth(res)
      toast.success(`Xin chào, ${res.user.fullName}!`)
      onSuccess()
    } catch (err) {
      set({
        error: err instanceof ApiError ? err.message : 'Đăng nhập thất bại',
        // 403 = tài khoản chưa xác thực email
        needsVerification: err instanceof ApiError && err.status === 403
      })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '', needsVerification: false })
}))
