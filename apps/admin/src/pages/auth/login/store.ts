import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import type { LoginInput } from '@lib/schemas/auth'

interface LoginState {
  loading: boolean
  error: string

  submit: (data: LoginInput, onSuccess: () => void) => Promise<void>
  reset: () => void
}

export const useLoginStore = create<LoginState>((set) => ({
  loading: false,
  error: '',

  submit: async (data, onSuccess) => {
    set({ error: '', loading: true })
    try {
      const res = await authService.login(data)
      useAuthStore.getState().setAuth(res)
      toast.success(`Xin chào, ${res.user.fullName}!`)
      onSuccess()
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Đăng nhập thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '' })
}))
