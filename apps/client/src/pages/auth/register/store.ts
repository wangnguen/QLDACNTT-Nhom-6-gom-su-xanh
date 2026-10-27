import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError } from '@lib/api'
import type { RegisterInput } from '@lib/schemas/auth'

interface RegisterState {
  loading: boolean
  error: string

  submit: (data: RegisterInput, onSuccess: (email: string) => void) => Promise<void>
  reset: () => void
}

export const useRegisterStore = create<RegisterState>((set) => ({
  loading: false,
  error: '',

  submit: async ({ agree: _agree, ...payload }, onSuccess) => {
    set({ error: '', loading: true })
    try {
      const { user } = await authService.register(payload)
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực')
      onSuccess(user.email)
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Đăng ký thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '' })
}))
