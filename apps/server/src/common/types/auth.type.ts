import { UserGender, UserRole } from '@common/constants'

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthUser = {
  id: string
  email: string
  fullName: string
  phone: string | null
  gender: UserGender | null
  address: string | null
  role: UserRole
  avatarUrl: string | null
  isEmailVerified: boolean
}

export type AuthResponse = AuthTokens & {
  user: AuthUser
}

export type AccessTokenPayload = {
  sub: string
  email: string
  role: string
}

export type RefreshTokenPayload = {
  sub: string
}

export type EmailParams = {
  name: string
  appName: string
  supportEmail: string
  expireMinutes: number
}

export type OtpEmailParams = EmailParams & {
  code: string
  actionUrl: string
}

// Email thông báo bảo mật (đã đổi email / mật khẩu) — không có mã nên không cần thời hạn
export type NoticeEmailParams = Omit<EmailParams, 'expireMinutes'> & {
  actionUrl: string
  changedAt: string
}

export type EmailChangedParams = NoticeEmailParams & {
  newEmail: string
}
