import { create } from 'zustand'
import { toast } from 'sonner'
import { authService, ApiError, setAccessToken } from '@lib/api'
import type { ChangePasswordInput } from '@lib/schemas/account'

interface ChangePasswordState {
  loading: boolean
  error: string

  submit: (data: ChangePasswordInput, onSuccess: () => void) => Promise<void>
  reset: () => void
}

export const useChangePasswordStore = create<ChangePasswordState>((set) => ({
  loading: false,
  error: '',

  submit: async (data, onSuccess) => {
    set({ error: '', loading: true })
    try {
      // Server thu hồi mọi phiên cũ, set cookie refresh token mới và trả access token mới cho thiết bị này
      const { accessToken } = await authService.changePassword(data)
      setAccessToken(accessToken)
      toast.success('Đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất')
      onSuccess()
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Đổi mật khẩu thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '' })
}))
