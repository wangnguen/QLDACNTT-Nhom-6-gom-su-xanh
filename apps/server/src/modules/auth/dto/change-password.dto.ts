import { z } from 'zod/v4'

import { passwordSchema } from '@common/validators'

const ChangePasswordBodyBaseSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
})

export const ChangePasswordBodyExample = {
  currentPassword: 'GomSu@2026',
  newPassword: 'GomSu@2027',
  confirmPassword: 'GomSu@2027'
} satisfies z.input<typeof ChangePasswordBodyBaseSchema>

export const ChangePasswordBodySchema = ChangePasswordBodyBaseSchema.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  }
)
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword']
  })
  .meta({
    example: ChangePasswordBodyExample
  })

export type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>
