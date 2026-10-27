import { http } from '../axios'
import type { AuthResponse, LoginRequest, RefreshResponse } from '../types'

// US-02: Đăng nhập trang quản trị — server chỉ chấp nhận tài khoản role admin
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/admin/login', payload, { skipAuth: true })
  return data
}

// Refresh token là httpOnly cookie rt_admin — server tự đọc, không cần gửi body
export async function refreshToken(): Promise<RefreshResponse> {
  const { data } = await http.post<RefreshResponse>('/auth/admin/refresh-token', undefined, { skipAuth: true })
  return data
}

export async function logout(): Promise<void> {
  await http.post('/auth/admin/logout', undefined, { skipAuth: true })
}

export const authService = {
  login,
  refreshToken,
  logout
}
