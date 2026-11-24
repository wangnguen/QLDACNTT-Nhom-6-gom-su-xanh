import { z } from 'zod'
import { fullNameField, phoneField } from './auth'

// Khớp với server (US-14)
export const SHIPPING_FEE = 30_000
export const FREE_SHIPPING_THRESHOLD = 1_000_000

export const shippingFeeFor = (subtotal: number) => (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE)

export const checkoutSchema = z.object({
  recipientName: fullNameField,
  recipientPhone: phoneField,
  shippingAddress: z
    .string()
    .trim()
    .min(10, 'Vui lòng ghi rõ số nhà, đường, phường/xã, tỉnh/thành')
    .max(255, 'Địa chỉ tối đa 255 ký tự'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự'),
  paymentMethod: z.enum(['cod', 'vnpay'], 'Vui lòng chọn phương thức thanh toán')
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
