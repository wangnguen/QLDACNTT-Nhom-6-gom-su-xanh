import { z } from 'zod/v4'

import { catalogNameSchema, imageUrlSchema, optionalTextSchema } from '@common/validators'

export const CategoryBodyFields = {
  name: catalogNameSchema('Tên danh mục', 100),
  description: optionalTextSchema('Mô tả', 1000),
  imageUrl: imageUrlSchema.nullable(),
  isActive: z.boolean('Trạng thái hiển thị không hợp lệ')
}

const CreateCategoryBodyBaseSchema = z.object({
  name: CategoryBodyFields.name,
  description: CategoryBodyFields.description.nullable().optional(),
  imageUrl: CategoryBodyFields.imageUrl.optional(),
  isActive: CategoryBodyFields.isActive.optional()
})

export const CreateCategoryBodyExample = {
  name: 'Bình hoa',
  description: 'Bình cắm hoa men lam, men rạn thủ công Bát Tràng',
  imageUrl: 'https://example.com/images/binh-hoa.jpg',
  isActive: true
} satisfies z.input<typeof CreateCategoryBodyBaseSchema>

export const CreateCategoryBodySchema = CreateCategoryBodyBaseSchema.meta({
  example: CreateCategoryBodyExample
})

export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>
