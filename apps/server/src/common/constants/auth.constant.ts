import { env } from '@common/config'

export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user'
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const AUTH_TOKEN = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD'
} as const

export type AuthTokenType = (typeof AUTH_TOKEN)[keyof typeof AUTH_TOKEN]

export const OTP_LENGTH = 6
export const OTP_EXPIRE_MINUTES = env.OTP_EXPIRE_MINUTES
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60
