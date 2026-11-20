import { z } from 'zod/v4'

import { paginationQuerySchema, searchQuerySchema } from '@common/validators'

import { workshopSortSchema } from './admin-workshop-query.dto'

// Ngày dạng YYYY-MM-DD (giờ Việt Nam)
const dateQuerySchema = z.iso.date('Ngày phải có dạng YYYY-MM-DD')

const WorkshopQueryBaseSchema = paginationQuerySchema.extend({
  search: searchQuerySchema.optional(),
  // Lớp bắt đầu trong khoảng ngày [from, to] (tính cả hai ngày)
  from: dateQuerySchema.optional(),
  to: dateQuerySchema.optional(),
  // true = chỉ lớp còn nhận đăng ký (chưa qua hạn và còn chỗ)
  availableOnly: z.stringbool('Giá trị availableOnly không hợp lệ').optional(),
  sort: workshopSortSchema
})

export const WorkshopQuerySchema = WorkshopQueryBaseSchema.refine(
  (query) => !query.from || !query.to || query.from <= query.to,
  { message: 'Ngày bắt đầu không được sau ngày kết thúc', path: ['from'] }
)

export type WorkshopQuery = z.infer<typeof WorkshopQuerySchema>
