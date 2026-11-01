import { z } from 'zod/v4'

import { CategoryBodyFields } from './create-category.dto'

// Chỉ cập nhật các trường được gửi lên; description/imageUrl gửi null (hoặc description rỗng) để xoá
const UpdateCategoryBodyBaseSchema = z.object({
  name: CategoryBodyFields.name.optional(),
  description: CategoryBodyFields.description.nullable().optional(),
  imageUrl: CategoryBodyFields.imageUrl.optional(),
  isActive: CategoryBodyFields.isActive.optional()
})

export const UpdateCategoryBodyExample = {
  name: 'Bình hoa men lam',
  isActive: false
} satisfies z.input<typeof UpdateCategoryBodyBaseSchema>

export const UpdateCategoryBodySchema = UpdateCategoryBodyBaseSchema.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'Không có thông tin nào để cập nhật'
).meta({
  example: UpdateCategoryBodyExample
})

export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>
