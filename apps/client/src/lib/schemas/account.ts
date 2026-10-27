import { z } from 'zod'
import { emailField, otpField } from './auth'

// US-04
export const changeEmailSchema = z.object({
  newEmail: emailField,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại')
})

export const verifyChangeEmailSchema = z.object({
  otp: otpField
})

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
export type VerifyChangeEmailInput = z.infer<typeof verifyChangeEmailSchema>
