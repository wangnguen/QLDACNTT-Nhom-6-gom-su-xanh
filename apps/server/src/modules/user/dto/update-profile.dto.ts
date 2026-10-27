import { z } from 'zod/v4'

import { addressSchema, fullNameSchema, genderSchema, phoneSchema } from '@common/validators'

// Chỉ cập nhật các trường được gửi lên. Email đổi qua luồng OTP riêng (POST /auth/change-email).
const UpdateProfileBodyBaseSchema = z.object({
  fullName: fullNameSchema.optional(),
  phone: phoneSchema.optional(),
  gender: genderSchema.nullable().optional(),
  address: addressSchema.nullable().optional()
})

export const UpdateProfileBodyExample = {
  fullName: 'Nguyễn Văn An',
  phone: '0912345678',
  gender: 'male',
  address: '12 Bát Tràng, Gia Lâm, Hà Nội'
} satisfies z.input<typeof UpdateProfileBodyBaseSchema>

export const UpdateProfileBodySchema = UpdateProfileBodyBaseSchema.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'Không có thông tin nào để cập nhật'
).meta({
  example: UpdateProfileBodyExample
})

export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>
