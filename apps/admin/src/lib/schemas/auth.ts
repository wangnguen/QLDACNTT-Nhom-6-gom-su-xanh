import { z } from 'zod'

const PHONE_REGEX = /^0\d{9}$/

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại')
    .refine(
      (value) => z.email().safeParse(value).success || PHONE_REGEX.test(value),
      'Email hoặc số điện thoại không hợp lệ'
    ),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
})

export type LoginInput = z.infer<typeof loginSchema>
