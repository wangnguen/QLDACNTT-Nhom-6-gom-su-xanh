import { z } from 'zod/v4'

import { emailSchema, fullNameSchema, passwordSchema, phoneSchema } from '@common/validators'

const RegisterBodyBaseSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string()
})

export const RegisterBodyExample = {
  fullName: 'Nguyễn Văn An',
  email: 'nguyenvanan@gmail.com',
  phone: '0912345678',
  password: 'GomSu@2026',
  confirmPassword: 'GomSu@2026'
} satisfies z.input<typeof RegisterBodyBaseSchema>

export const RegisterBodySchema = RegisterBodyBaseSchema.refine((data) => data.confirmPassword === data.password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
}).meta({
  example: RegisterBodyExample
})

export type RegisterBody = z.infer<typeof RegisterBodySchema>
