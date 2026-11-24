import { z } from 'zod/v4'

import { optionalTextSchema } from '@common/validators'

export const cancelReasonSchema = optionalTextSchema('Lý do huỷ', 255).nullable().optional()

// US-16: Khách huỷ đơn — gửi body rỗng cũng được
const CancelOrderBodyBaseSchema = z.object({ reason: cancelReasonSchema })

export const CancelOrderBodyExample = {
  reason: 'Đặt nhầm mẫu'
} satisfies z.input<typeof CancelOrderBodyBaseSchema>

export const CancelOrderBodySchema = CancelOrderBodyBaseSchema.optional()
  .transform((body) => ({ reason: body?.reason ?? null }))
  .meta({ example: CancelOrderBodyExample })

export type CancelOrderBody = z.infer<typeof CancelOrderBodySchema>
