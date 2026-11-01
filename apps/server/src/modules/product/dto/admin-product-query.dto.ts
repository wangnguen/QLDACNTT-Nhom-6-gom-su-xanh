import { z } from 'zod/v4'

import { PRODUCT_SORT, PRODUCT_STATUS } from '@common/constants'
import { paginationQuerySchema, searchQuerySchema, uuidSchema } from '@common/validators'

export const productSortSchema = z.enum(PRODUCT_SORT, 'Kiểu sắp xếp không hợp lệ').default(PRODUCT_SORT.NEWEST)

export const AdminProductQuerySchema = paginationQuerySchema.extend({
  search: searchQuerySchema.optional(),
  categoryId: uuidSchema.optional(),
  status: z.enum(PRODUCT_STATUS, 'Trạng thái không hợp lệ').optional(),
  sort: productSortSchema
})

export type AdminProductQuery = z.infer<typeof AdminProductQuerySchema>
