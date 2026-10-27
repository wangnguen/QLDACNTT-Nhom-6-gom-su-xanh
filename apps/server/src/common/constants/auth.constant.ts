import { env } from '@common/config'

export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user'
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const AUTH_TOKEN = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD',
  CHANGE_EMAIL: 'CHANGE_EMAIL'
} as const

export type AuthTokenType = (typeof AUTH_TOKEN)[keyof typeof AUTH_TOKEN]

export const OTP_LENGTH = 6
export const OTP_EXPIRE_MINUTES = env.OTP_EXPIRE_MINUTES
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60

// Client và admin chạy chung domain (localhost) nên mỗi bên dùng cookie refresh token riêng,
// đăng nhập trang admin không ghi đè phiên đăng nhập của trang client và ngược lại.
export const AUTH_SCOPE = {
  CLIENT: { cookieName: 'rt', cookiePath: '/api/v1/auth', adminOnly: false },
  ADMIN: { cookieName: 'rt_admin', cookiePath: '/api/v1/auth/admin', adminOnly: true }
} as const

export type AuthScope = (typeof AUTH_SCOPE)[keyof typeof AUTH_SCOPE]

export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = env.JWT_REFRESH_EXPIRES_IN * 1000
