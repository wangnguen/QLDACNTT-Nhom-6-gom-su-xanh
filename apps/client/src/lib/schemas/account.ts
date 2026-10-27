import { z } from 'zod'
import { confirmPasswordField, emailField, otpField, passwordField } from './auth'

// US-04
export const changeEmailSchema = z.object({
  newEmail: emailField,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại')
})

export const verifyChangeEmailSchema = z.object({
  otp: otpField
})

// US-05
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordField,
    confirmPassword: confirmPasswordField
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword']
  })

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
export type VerifyChangeEmailInput = z.infer<typeof verifyChangeEmailSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
