import { z } from 'zod/v4'

import { optionalTextSchema } from '@common/validators'

// US-20: Cửa hàng xác nhận đã chuyển khoản hoàn tiền cho khách — body không bắt buộc
const CompleteRefundBodyBaseSchema = z.object({
  // Mã giao dịch ngân hàng / VNPay của khoản hoàn
  referenceNo: z
    .string()
    .trim()
    .max(50, 'Mã tham chiếu tối đa 50 ký tự')
    .transform((value) => value || null)
    .nullable()
    .optional(),
  note: optionalTextSchema('Ghi chú', 255).nullable().optional()
})

export const CompleteRefundBodyExample = {
  referenceNo: 'FT26324123456',
  note: 'Chuyển khoản Vietcombank'
} satisfies z.input<typeof CompleteRefundBodyBaseSchema>

export const CompleteRefundBodySchema = CompleteRefundBodyBaseSchema.optional()
  .transform((body) => ({ referenceNo: body?.referenceNo ?? null, note: body?.note ?? null }))
  .meta({ example: CompleteRefundBodyExample })

export type CompleteRefundBody = z.infer<typeof CompleteRefundBodySchema>
