import { z } from 'zod/v4'

import { emailSchema, otpSchema, passwordSchema } from '@common/validators'

const ResetPasswordBodyBaseSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  password: passwordSchema,
  confirmPassword: z.string()
})

export const ResetPasswordBodyExample = {
  email: 'nguyenvanan@gmail.com',
  otp: '123456',
  password: 'GomSu@2027',
  confirmPassword: 'GomSu@2027'
} satisfies z.input<typeof ResetPasswordBodyBaseSchema>

export const ResetPasswordBodySchema = ResetPasswordBodyBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  }
).meta({
  example: ResetPasswordBodyExample
})

export type ResetPasswordBody = z.infer<typeof ResetPasswordBodySchema>
