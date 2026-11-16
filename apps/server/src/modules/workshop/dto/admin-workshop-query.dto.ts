import { z } from 'zod/v4'

import { WORKSHOP_SORT, WORKSHOP_STATUS, WORKSHOP_TIME } from '@common/constants'
import { paginationQuerySchema, searchQuerySchema } from '@common/validators'

export const workshopSortSchema = z.enum(WORKSHOP_SORT, 'Kiểu sắp xếp không hợp lệ').default(WORKSHOP_SORT.START_ASC)

export const AdminWorkshopQuerySchema = paginationQuerySchema.extend({
  search: searchQuerySchema.optional(),
  status: z.enum(WORKSHOP_STATUS, 'Trạng thái không hợp lệ').optional(),
  // upcoming = chưa kết thúc, past = đã kết thúc; bỏ trống = tất cả
  time: z.enum(WORKSHOP_TIME, 'Bộ lọc thời gian không hợp lệ').optional(),
  sort: workshopSortSchema
})

export type AdminWorkshopQuery = z.infer<typeof AdminWorkshopQuerySchema>
