import { z } from 'zod/v4'

import { MAX_SEATS_PER_REGISTRATION } from '@common/constants'
import { fullNameSchema, optionalTextSchema, phoneSchema } from '@common/validators'

const CreateRegistrationBodyBaseSchema = z.object({
  workshopId: z.uuid('Lớp workshop không hợp lệ'),
  seats: z
    .number('Số chỗ phải là số')
    .int('Số chỗ phải là số nguyên')
    .min(1, 'Đặt ít nhất 1 chỗ')
    .max(MAX_SEATS_PER_REGISTRATION, `Mỗi lượt đăng ký tối đa ${MAX_SEATS_PER_REGISTRATION} chỗ`)
    .default(1),
  // Người liên hệ — mặc định trang client điền sẵn từ hồ sơ, khách có thể sửa
  contactName: fullNameSchema,
  contactPhone: phoneSchema,
  note: optionalTextSchema('Ghi chú', 500).nullable().optional()
})

export const CreateRegistrationBodyExample = {
  workshopId: '5b6c7d8e-9f01-4234-8567-89abcdef0123',
  seats: 2,
  contactName: 'Nguyễn Văn An',
  contactPhone: '0912345678',
  note: 'Đi cùng một bé 8 tuổi'
} satisfies z.input<typeof CreateRegistrationBodyBaseSchema>

export const CreateRegistrationBodySchema = CreateRegistrationBodyBaseSchema.meta({
  example: CreateRegistrationBodyExample
})

export type CreateRegistrationBody = z.infer<typeof CreateRegistrationBodySchema>
