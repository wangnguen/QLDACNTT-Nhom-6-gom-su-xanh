import { z } from 'zod/v4'

import { PostBodyFields } from './create-post.dto'

// Chỉ cập nhật các trường được gửi lên; excerpt/coverImageUrl gửi null để xoá
const UpdatePostBodyBaseSchema = z.object({
  title: PostBodyFields.title.optional(),
  excerpt: PostBodyFields.excerpt.nullable().optional(),
  content: PostBodyFields.content.optional(),
  coverImageUrl: PostBodyFields.coverImageUrl.optional(),
  categoryId: PostBodyFields.categoryId.optional(),
  status: PostBodyFields.status.optional()
})

export const UpdatePostBodyExample = {
  status: 'draft'
} satisfies z.input<typeof UpdatePostBodyBaseSchema>

export const UpdatePostBodySchema = UpdatePostBodyBaseSchema.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'Không có thông tin nào để cập nhật'
).meta({ example: UpdatePostBodyExample })

export type UpdatePostBody = z.infer<typeof UpdatePostBodySchema>
