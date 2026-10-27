import { http } from '../axios'
import type {
  AuthResponse,
  AuthUser,
  ChangeEmailRequest,
  ChangePasswordRequest,
  EmailRequest,
  LoginRequest,
  OtpRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '../types'

// US-01: Đăng ký tài khoản
export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await http.post<RegisterResponse>('/auth/register', payload, { skipAuth: true })
  return data
}

export async function verifyEmail(payload: VerifyEmailRequest): Promise<void> {
  await http.post('/auth/verify-email', payload, { skipAuth: true })
}

export async function resendVerification(payload: EmailRequest): Promise<void> {
  await http.post('/auth/resend-verification', payload, { skipAuth: true })
}

// US-02: Đăng nhập hệ thống
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', payload, { skipAuth: true })
  return data
}

// Refresh token là httpOnly cookie — server tự đọc, không cần gửi body
export async function refreshToken(): Promise<RefreshResponse> {
  const { data } = await http.post<RefreshResponse>('/auth/refresh-token', undefined, { skipAuth: true })
  return data
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout', undefined, { skipAuth: true })
}

// US-03: Quên mật khẩu
export async function forgotPassword(payload: EmailRequest): Promise<void> {
  await http.post('/auth/forgot-password', payload, { skipAuth: true })
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await http.post('/auth/reset-password', payload, { skipAuth: true })
}

// US-04: Thay đổi email — gửi OTP tới email mới, sau đó xác nhận bằng OTP
export async function requestChangeEmail(payload: ChangeEmailRequest): Promise<void> {
  await http.post('/auth/change-email', payload)
}

export async function verifyChangeEmail(payload: OtpRequest): Promise<AuthUser> {
  const { data } = await http.post<AuthUser>('/auth/change-email/verify', payload)
  return data
}

// US-05: Thay đổi mật khẩu — server đăng xuất thiết bị khác, trả access token mới cho thiết bị này
export async function changePassword(payload: ChangePasswordRequest): Promise<RefreshResponse> {
  const { data } = await http.post<RefreshResponse>('/auth/change-password', payload)
  return data
}

export const authService = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  requestChangeEmail,
  verifyChangeEmail,
  changePassword
}
