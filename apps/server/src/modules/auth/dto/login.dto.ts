import { z } from 'zod/v4'

import { PHONE_REGEX } from '@common/validators'

const LoginBodyBaseSchema = z.object({
  // Đăng nhập bằng email hoặc số điện thoại
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại')
    .toLowerCase()
    .refine(
      (value) => z.email().safeParse(value).success || PHONE_REGEX.test(value),
      'Email hoặc số điện thoại không hợp lệ'
    ),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
})

export const LoginBodyExample = {
  identifier: 'nguyenvanan@gmail.com',
  password: 'GomSu@2026'
} satisfies z.input<typeof LoginBodyBaseSchema>

export const LoginBodyPhoneExample = {
  identifier: '0912345678',
  password: 'GomSu@2026'
} satisfies z.input<typeof LoginBodyBaseSchema>

export const LoginBodySchema = LoginBodyBaseSchema.meta({ example: LoginBodyExample })

export type LoginBody = z.infer<typeof LoginBodySchema>
