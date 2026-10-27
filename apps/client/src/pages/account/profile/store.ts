import { create } from 'zustand'
import { toast } from 'sonner'
import { usersService, ApiError } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import type { ProfileInput } from '@lib/schemas/account'

interface ProfileState {
  loading: boolean
  error: string

  submit: (data: ProfileInput) => Promise<void>
  reset: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  loading: false,
  error: '',

  submit: async ({ gender, address, ...rest }) => {
    set({ error: '', loading: true })
    try {
      const user = await usersService.updateProfile({ ...rest, gender: gender || null, address: address || null })
      useAuthStore.getState().setUser(user)
      toast.success('Đã lưu thông tin cá nhân')
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Lưu thông tin thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '' })
}))
