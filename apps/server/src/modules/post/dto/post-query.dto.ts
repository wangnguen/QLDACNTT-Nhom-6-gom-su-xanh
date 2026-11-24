import { z } from 'zod/v4'

import { paginationQuerySchema, searchQuerySchema } from '@common/validators'

// US-23: Danh sách bài viết ở trang tin tức — mới đăng lên trước
export const PostQuerySchema = paginationQuerySchema.extend({
  // Slug danh mục, vd kien-thuc-gom
  category: z.string().trim().max(110).optional(),
  search: searchQuerySchema.optional()
})

export type PostQuery = z.infer<typeof PostQuerySchema>
