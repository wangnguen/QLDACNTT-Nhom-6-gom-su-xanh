import { z } from 'zod/v4'

import { PAYMENT_METHOD } from '@common/constants'
import { fullNameSchema, optionalTextSchema, phoneSchema } from '@common/validators'

const CreateOrderBodyBaseSchema = z.object({
  // Người nhận — mặc định trang client điền sẵn từ hồ sơ, khách có thể sửa
  recipientName: fullNameSchema,
  recipientPhone: phoneSchema,
  shippingAddress: z
    .string('Vui lòng nhập địa chỉ giao hàng')
    .trim()
    .min(10, 'Địa chỉ giao hàng quá ngắn, vui lòng ghi rõ số nhà, đường, phường/xã, tỉnh/thành')
    .max(255, 'Địa chỉ giao hàng tối đa 255 ký tự'),
  note: optionalTextSchema('Ghi chú', 500).nullable().optional(),
  paymentMethod: z.enum(PAYMENT_METHOD, 'Phương thức thanh toán chỉ được là cod hoặc vnpay')
})

export const CreateOrderBodyExample = {
  recipientName: 'Nguyễn Văn An',
  recipientPhone: '0912345678',
  shippingAddress: '12 Bát Tràng, xã Bát Tràng, Gia Lâm, Hà Nội',
  note: 'Giao giờ hành chính',
  paymentMethod: 'vnpay'
} satisfies z.input<typeof CreateOrderBodyBaseSchema>

export const CreateOrderBodySchema = CreateOrderBodyBaseSchema.meta({ example: CreateOrderBodyExample })

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>
