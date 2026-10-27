import { UserRole } from '@common/constants'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: UserRole
  avatarUrl: string | null
  isEmailVerified: boolean
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
