import { z } from 'zod/v4'

import { emailSchema } from '@common/validators'

const ChangeEmailBodyBaseSchema = z.object({
  newEmail: emailSchema,
  // Nhập lại mật khẩu: lỡ bị lộ phiên đăng nhập thì kẻ gian cũng không đổi được email để chiếm tài khoản
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
})

export const ChangeEmailBodyExample = {
  newEmail: 'an.nguyen@gmail.com',
  password: 'GomSu@2026'
} satisfies z.input<typeof ChangeEmailBodyBaseSchema>

export const ChangeEmailBodySchema = ChangeEmailBodyBaseSchema.meta({
  example: ChangeEmailBodyExample
})

export type ChangeEmailBody = z.infer<typeof ChangeEmailBodySchema>
