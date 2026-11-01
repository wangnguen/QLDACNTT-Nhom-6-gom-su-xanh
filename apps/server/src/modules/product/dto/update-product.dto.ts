import { z } from 'zod/v4'

import { ProductBodyFields } from './create-product.dto'

// Chỉ cập nhật các trường được gửi lên; description/material/dimensions gửi null hoặc chuỗi rỗng để xoá
const UpdateProductBodyBaseSchema = z.object({
  name: ProductBodyFields.name.optional(),
  categoryId: ProductBodyFields.categoryId.optional(),
  price: ProductBodyFields.price.optional(),
  stock: ProductBodyFields.stock.optional(),
  description: ProductBodyFields.description.nullable().optional(),
  material: ProductBodyFields.material.nullable().optional(),
  dimensions: ProductBodyFields.dimensions.nullable().optional(),
  imageUrls: ProductBodyFields.imageUrls.optional(),
  isActive: ProductBodyFields.isActive.optional()
})

export const UpdateProductBodyExample = {
  price: 420000,
  stock: 15,
  isActive: false
} satisfies z.input<typeof UpdateProductBodyBaseSchema>

export const UpdateProductBodySchema = UpdateProductBodyBaseSchema.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'Không có thông tin nào để cập nhật'
).meta({
  example: UpdateProductBodyExample
})

export type UpdateProductBody = z.infer<typeof UpdateProductBodySchema>
