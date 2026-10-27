import { create } from 'zustand'
import { type AuthUser, type AuthResponse, authService, usersService, setAccessToken } from '../lib/api'

// Đánh dấu "đã từng đăng nhập" để lần mở trang sau mới thử refresh token (tránh gọi API thừa với khách)
const SESSION_FLAG = 'hasSession'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  initialized: boolean

  setAuth: (data: AuthResponse) => void
  logout: () => Promise<void>
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  initialized: false,

  setAuth: (data: AuthResponse) => {
    setAccessToken(data.accessToken)
    localStorage.setItem(SESSION_FLAG, '1')
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    await authService.logout().catch(() => {})
    setAccessToken(null)
    localStorage.removeItem(SESSION_FLAG)
    set({ user: null, isAuthenticated: false })
  },

  initAuth: async () => {
    if (!localStorage.getItem(SESSION_FLAG)) {
      set({ initialized: true })
      return
    }
    try {
      const { accessToken } = await authService.refreshToken()
      setAccessToken(accessToken)
      const user = await usersService.getMe()
      set({ user, isAuthenticated: true, initialized: true })
    } catch {
      setAccessToken(null)
      localStorage.removeItem(SESSION_FLAG)
      set({ user: null, isAuthenticated: false, initialized: true })
    }
  }
}))
