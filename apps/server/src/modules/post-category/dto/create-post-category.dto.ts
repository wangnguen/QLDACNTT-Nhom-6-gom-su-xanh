import { z } from 'zod/v4'

import { catalogNameSchema, optionalTextSchema } from '@common/validators'

export const PostCategoryBodyFields = {
  name: catalogNameSchema('Tên danh mục', 100),
  description: optionalTextSchema('Mô tả', 500),
  isActive: z.boolean('Trạng thái hiển thị không hợp lệ')
}

const CreatePostCategoryBodyBaseSchema = z.object({
  name: PostCategoryBodyFields.name,
  description: PostCategoryBodyFields.description.nullable().optional(),
  isActive: PostCategoryBodyFields.isActive.optional()
})

export const CreatePostCategoryBodyExample = {
  name: 'Kiến thức gốm',
  description: 'Cách nhận biết men, cách dùng và bảo quản đồ gốm',
  isActive: true
} satisfies z.input<typeof CreatePostCategoryBodyBaseSchema>

export const CreatePostCategoryBodySchema = CreatePostCategoryBodyBaseSchema.meta({
  example: CreatePostCategoryBodyExample
})

export type CreatePostCategoryBody = z.infer<typeof CreatePostCategoryBodySchema>
