import { z } from 'zod/v4'

import { MAX_DAILY_STATS_DAYS, STATS_GROUP_BY } from '@common/constants'

const DAY_MS = 24 * 60 * 60 * 1000

// Ngày dạng YYYY-MM-DD (giờ Việt Nam)
const dateQuerySchema = z.iso.date('Ngày phải có dạng YYYY-MM-DD')

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1

// US-26: Thống kê doanh thu — bỏ trống from/to thì xem 30 ngày gần nhất
export const RevenueQuerySchema = z
  .object({
    from: dateQuerySchema.optional(),
    to: dateQuerySchema.optional(),
    groupBy: z.enum(STATS_GROUP_BY, 'Chỉ nhóm theo day hoặc month').default(STATS_GROUP_BY.DAY)
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'Ngày bắt đầu không được sau ngày kết thúc',
    path: ['from']
  })
  .refine(
    (query) =>
      query.groupBy !== STATS_GROUP_BY.DAY ||
      !query.from ||
      !query.to ||
      daysBetween(query.from, query.to) <= MAX_DAILY_STATS_DAYS,
    { message: `Xem theo ngày tối đa ${MAX_DAILY_STATS_DAYS} ngày, hãy chọn xem theo tháng`, path: ['groupBy'] }
  )

export type RevenueQuery = z.infer<typeof RevenueQuerySchema>
