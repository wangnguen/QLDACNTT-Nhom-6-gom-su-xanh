import { z } from 'zod/v4'

import { MAX_PRODUCT_IMAGES, MAX_PRODUCT_PRICE, MAX_PRODUCT_STOCK } from '@common/constants'
import { catalogNameSchema, imageUrlSchema, optionalTextSchema } from '@common/validators'

export const ProductBodyFields = {
  name: catalogNameSchema('Tên sản phẩm', 255),
  categoryId: z.uuid('Vui lòng chọn danh mục'),
  price: z
    .number('Giá bán phải là số')
    .int('Giá bán phải là số nguyên')
    .positive('Giá bán phải lớn hơn 0')
    .max(MAX_PRODUCT_PRICE, 'Giá bán quá lớn'),
  stock: z
    .number('Tồn kho phải là số')
    .int('Tồn kho phải là số nguyên')
    .min(0, 'Tồn kho không được âm')
    .max(MAX_PRODUCT_STOCK, `Tồn kho tối đa ${MAX_PRODUCT_STOCK.toLocaleString('vi-VN')}`),
  description: optionalTextSchema('Mô tả', 5000),
  material: optionalTextSchema('Chất liệu', 100),
  dimensions: optionalTextSchema('Kích thước', 100),
  imageUrls: z
    .array(imageUrlSchema)
    .max(MAX_PRODUCT_IMAGES, `Tối đa ${MAX_PRODUCT_IMAGES} ảnh`)
    .refine((urls) => new Set(urls).size === urls.length, 'Có link ảnh bị trùng'),
  isActive: z.boolean('Trạng thái hiển thị không hợp lệ')
}

const CreateProductBodyBaseSchema = z.object({
  name: ProductBodyFields.name,
  categoryId: ProductBodyFields.categoryId,
  price: ProductBodyFields.price,
  stock: ProductBodyFields.stock.default(0),
  description: ProductBodyFields.description.nullable().optional(),
  material: ProductBodyFields.material.nullable().optional(),
  dimensions: ProductBodyFields.dimensions.nullable().optional(),
  imageUrls: ProductBodyFields.imageUrls.default([]),
  isActive: ProductBodyFields.isActive.default(true)
})

export const CreateProductBodyExample = {
  name: 'Bình hoa men lam vẽ sen',
  categoryId: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  price: 450000,
  stock: 20,
  description: 'Bình hoa men lam vẽ tay hoạ tiết hoa sen, nung ở 1.300°C.',
  material: 'Gốm men lam',
  dimensions: 'Cao 30cm, miệng 10cm',
  imageUrls: ['https://example.com/images/binh-hoa-sen-1.jpg', 'https://example.com/images/binh-hoa-sen-2.jpg'],
  isActive: true
} satisfies z.input<typeof CreateProductBodyBaseSchema>

export const CreateProductBodySchema = CreateProductBodyBaseSchema.meta({
  example: CreateProductBodyExample
})

export type CreateProductBody = z.infer<typeof CreateProductBodySchema>
