import { z } from 'zod/v4'

import { SHIPMENT_ACTION } from '@common/constants'

import { shippingCarrierSchema } from './admin-order-query.dto'

const trackingCodeSchema = z
  .string('Vui lòng nhập mã vận đơn')
  .trim()
  .min(1, 'Vui lòng nhập mã vận đơn')
  .max(50, 'Mã vận đơn tối đa 50 ký tự')
  .regex(/^[A-Za-z0-9._-]+$/, 'Mã vận đơn chỉ gồm chữ, số và các ký tự . _ -')

const shipmentInfo = {
  shippingCarrier: shippingCarrierSchema,
  // Cửa hàng tự giao thì không cần mã vận đơn
  trackingCode: trackingCodeSchema.nullable().optional()
}

const requireTrackingCode = (body: { shippingCarrier: string; trackingCode?: string | null }) =>
  body.shippingCarrier === 'shop' || !!body.trackingCode

// US-19: Cửa hàng cập nhật vận chuyển — mỗi `action` một bước
const UpdateShipmentBodyBaseSchema = z.discriminatedUnion(
  'action',
  [
    z.object({ action: z.literal(SHIPMENT_ACTION.SHIP), ...shipmentInfo }),
    z.object({ action: z.literal(SHIPMENT_ACTION.UPDATE), ...shipmentInfo }),
    z.object({ action: z.literal(SHIPMENT_ACTION.DELIVER) }),
    z.object({
      action: z.literal(SHIPMENT_ACTION.RETURN),
      reason: z
        .string('Vui lòng nhập lý do giao không thành công')
        .trim()
        .min(1, 'Vui lòng nhập lý do giao không thành công')
        .max(255, 'Lý do tối đa 255 ký tự')
    })
  ],
  'Thao tác chỉ được là ship, update, deliver hoặc return'
)

export const UpdateShipmentBodyExample = {
  action: 'ship',
  shippingCarrier: 'ghn',
  trackingCode: 'GHN5K7Q2M9'
} satisfies z.input<typeof UpdateShipmentBodyBaseSchema>

export const UpdateShipmentBodySchema = UpdateShipmentBodyBaseSchema.refine(
  (body) => !('shippingCarrier' in body) || requireTrackingCode(body),
  { message: 'Vui lòng nhập mã vận đơn', path: ['trackingCode'] }
).meta({ example: UpdateShipmentBodyExample })

export type UpdateShipmentBody = z.infer<typeof UpdateShipmentBodySchema>
