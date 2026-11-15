import { z } from 'zod/v4'

import { ADMIN_REGISTRATION_ACTIONS } from '@common/constants'
import { optionalTextSchema } from '@common/validators'

const reasonSchema = optionalTextSchema('Lý do huỷ', 255).nullable().optional()

// US-13: Khách tự huỷ — gửi body rỗng cũng được
const CancelRegistrationBodyBaseSchema = z.object({ reason: reasonSchema })

export const CancelRegistrationBodyExample = {
  reason: 'Bận việc đột xuất'
} satisfies z.input<typeof CancelRegistrationBodyBaseSchema>

export const CancelRegistrationBodySchema = CancelRegistrationBodyBaseSchema.optional()
  .transform((body) => ({ reason: body?.reason ?? null }))
  .meta({ example: CancelRegistrationBodyExample })

export type CancelRegistrationBody = z.infer<typeof CancelRegistrationBodySchema>

// US-13: Cửa hàng xác nhận / check-in / huỷ đăng ký
const UpdateRegistrationStatusBodyBaseSchema = z.object({
  status: z.enum(ADMIN_REGISTRATION_ACTIONS, 'Trạng thái chỉ được là confirmed, attended hoặc cancelled'),
  // Chỉ dùng khi huỷ; khách sẽ thấy lý do này
  cancelReason: reasonSchema
})

export const UpdateRegistrationStatusBodyExample = {
  status: 'cancelled',
  cancelReason: 'Lớp tạm hoãn vì nghệ nhân ốm'
} satisfies z.input<typeof UpdateRegistrationStatusBodyBaseSchema>

export const UpdateRegistrationStatusBodySchema = UpdateRegistrationStatusBodyBaseSchema.meta({
  example: UpdateRegistrationStatusBodyExample
})

export type UpdateRegistrationStatusBody = z.infer<typeof UpdateRegistrationStatusBodySchema>
