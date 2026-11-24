import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { PAYMENT_METHOD } from '@common/constants'

import { RevenueQuerySchema } from '@modules/stats/dto'

import { forbiddenResponse, successWrapper, unauthorizedResponse, validationErrorResponse } from './shared'

// ─── US-26: Thống kê doanh thu ───────────────────────────────────────────────

const RevenueSummarySchema = z.object({
  revenue: z
    .number()
    .int()
    .meta({ example: 12_450_000, description: 'Tổng tiền các đơn giao thành công (gồm phí giao)' }),
  deliveredOrders: z.number().int().meta({ example: 21 }),
  averageOrderValue: z.number().int().meta({ example: 592_857 }),
  newOrders: z.number().int().meta({ example: 26, description: 'Đơn đặt trong kỳ' }),
  cancelledOrders: z.number().int().meta({ example: 2 }),
  refundedAmount: z.number().int().meta({ example: 430_000 }),
  workshopRevenue: z.number().int().meta({ example: 2_100_000, description: 'Học phí các lượt đã tham gia lớp' })
})

const RevenueStatsSchema = registry.register(
  'RevenueStats',
  z.object({
    from: z.string().meta({ example: '2026-10-26' }),
    to: z.string().meta({ example: '2026-11-24' }),
    groupBy: z.enum(['day', 'month']).meta({ example: 'day' }),
    summary: RevenueSummarySchema,
    previous: RevenueSummarySchema.meta({ description: 'Kỳ liền trước cùng độ dài' }),
    series: z.array(
      z.object({
        period: z.string().meta({ example: '2026-11-24', description: 'YYYY-MM-DD hoặc YYYY-MM (giờ Việt Nam)' }),
        revenue: z.number().int().meta({ example: 860_000 }),
        orders: z.number().int().meta({ example: 2 })
      })
    ),
    topProducts: z.array(
      z.object({
        productId: z.string().uuid().nullable(),
        name: z.string().meta({ example: 'Bình hoa men lam vẽ sen' }),
        slug: z.string().meta({ example: 'binh-hoa-men-lam-ve-sen' }),
        imageUrl: z.string().url().nullable(),
        quantity: z.number().int().meta({ example: 9 }),
        revenue: z.number().int().meta({ example: 4_050_000, description: 'Tiền hàng, không gồm phí giao' })
      })
    ),
    byPaymentMethod: z.array(
      z.object({
        method: z.enum(PAYMENT_METHOD).meta({ example: 'vnpay' }),
        revenue: z.number().int().meta({ example: 7_200_000 }),
        orders: z.number().int().meta({ example: 12 })
      })
    )
  })
)

registry.registerPath({
  method: 'get',
  path: '/admin/stats/revenue',
  tags: ['Admin - Thống kê doanh thu (US-26)'],
  summary: 'Thống kê doanh thu',
  description: `Doanh thu = tổng tiền (gồm phí giao hàng) các đơn **giao thành công** trong kỳ, tính theo ngày giao, giờ Việt Nam.

- \`from\`, \`to\` (YYYY-MM-DD): bỏ trống thì xem 30 ngày gần nhất
- \`groupBy\`: \`day\` (tối đa 366 ngày) hoặc \`month\`; \`series\` có đủ mọi ngày / tháng kể cả kỳ không có đơn
- \`previous\`: cùng các chỉ số của kỳ liền trước cùng độ dài, để so sánh tăng giảm
- \`topProducts\`: 5 sản phẩm có doanh thu cao nhất; \`byPaymentMethod\`: doanh thu theo phương thức thanh toán`,
  security: [{ bearerAuth: [] }],
  request: { query: RevenueQuerySchema },
  responses: {
    200: {
      description: 'Thống kê',
      content: { 'application/json': { schema: successWrapper(RevenueStatsSchema, '/admin/stats/revenue') } }
    },
    401: unauthorizedResponse('Thiếu hoặc sai access token'),
    403: forbiddenResponse('Bạn không có quyền truy cập'),
    422: validationErrorResponse()
  }
})
