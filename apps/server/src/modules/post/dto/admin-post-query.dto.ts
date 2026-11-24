import { z } from 'zod/v4'

import { POST_STATUS } from '@common/constants'
import { paginationQuerySchema, searchQuerySchema, uuidSchema } from '@common/validators'

// US-22: Danh sách bài viết ở trang admin — mới sửa lên trước
export const AdminPostQuerySchema = paginationQuerySchema.extend({
  // Tìm theo tiêu đề
  search: searchQuerySchema.optional(),
  categoryId: uuidSchema.optional(),
  status: z.enum(POST_STATUS, 'Trạng thái không hợp lệ').optional()
})

export type AdminPostQuery = z.infer<typeof AdminPostQuerySchema>
