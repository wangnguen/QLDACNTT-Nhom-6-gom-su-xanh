import { z } from 'zod'

// Giữ khớp với validator của server (apps/server/src/common/validators)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,72}$/
const PASSWORD_MESSAGE = 'Mật khẩu từ 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt, không có khoảng trắng'
const PHONE_REGEX = /^0\d{9}$/

export const PASSWORD_HINT = 'Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt'
export const OTP_RESEND_SECONDS = 60

const emailField = z.string().trim().min(1, 'Vui lòng nhập email').pipe(z.email('Email không hợp lệ'))
const passwordField = z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE)
const otpField = z.string().regex(/^\d{6}$/, 'Vui lòng nhập đủ 6 chữ số của mã OTP')
const confirmPasswordField = z.string().min(1, 'Vui lòng nhập lại mật khẩu')

const passwordsMatch = {
  check: (d: { password: string; confirmPassword: string }) => d.password === d.confirmPassword,
  params: { message: 'Mật khẩu xác nhận không khớp', path: ['confirmPassword'] }
}

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên').max(255, 'Họ tên tối đa 255 ký tự'),
    email: emailField,
    phone: z.string().trim().regex(PHONE_REGEX, 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0'),
    password: passwordField,
    confirmPassword: confirmPasswordField,
    agree: z.boolean().refine((value) => value, 'Bạn cần đồng ý với điều khoản sử dụng')
  })
  .refine(passwordsMatch.check, passwordsMatch.params)

export const verifyEmailSchema = z.object({
  email: emailField,
  otp: otpField
})

export type RegisterInput = z.infer<typeof registerSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
