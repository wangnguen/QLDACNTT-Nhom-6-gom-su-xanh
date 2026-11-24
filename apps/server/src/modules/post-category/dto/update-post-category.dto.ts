import { z } from 'zod/v4'

import { PostCategoryBodyFields } from './create-post-category.dto'

// Chỉ cập nhật các trường được gửi lên; description gửi null hoặc chuỗi rỗng để xoá
const UpdatePostCategoryBodyBaseSchema = z.object({
  name: PostCategoryBodyFields.name.optional(),
  description: PostCategoryBodyFields.description.nullable().optional(),
  isActive: PostCategoryBodyFields.isActive.optional()
})

export const UpdatePostCategoryBodyExample = {
  isActive: false
} satisfies z.input<typeof UpdatePostCategoryBodyBaseSchema>

export const UpdatePostCategoryBodySchema = UpdatePostCategoryBodyBaseSchema.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'Không có thông tin nào để cập nhật'
).meta({ example: UpdatePostCategoryBodyExample })

export type UpdatePostCategoryBody = z.infer<typeof UpdatePostCategoryBodySchema>
