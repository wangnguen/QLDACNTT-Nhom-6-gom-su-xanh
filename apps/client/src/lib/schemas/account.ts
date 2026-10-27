import { z } from 'zod'
import { confirmPasswordField, emailField, fullNameField, otpField, passwordField, phoneField } from './auth'

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
] as const

// US-06: '' = chưa chọn giới tính / chưa nhập địa chỉ → gửi null lên server
export const profileSchema = z.object({
  fullName: fullNameField,
  phone: phoneField,
  gender: z.enum(['male', 'female', 'other']).or(z.literal('')),
  address: z.string().trim().max(255, 'Địa chỉ tối đa 255 ký tự')
})

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

export type ProfileInput = z.infer<typeof profileSchema>
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
export type VerifyChangeEmailInput = z.infer<typeof verifyChangeEmailSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
