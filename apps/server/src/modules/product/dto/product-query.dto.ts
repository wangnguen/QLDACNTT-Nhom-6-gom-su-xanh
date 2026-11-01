import { z } from 'zod/v4'

import { MAX_PRODUCT_PRICE } from '@common/constants'
import { paginationQuerySchema, searchQuerySchema } from '@common/validators'

import { productSortSchema } from './admin-product-query.dto'

const priceQuerySchema = z.coerce
  .number('Giá phải là số')
  .int('Giá phải là số nguyên')
  .min(0, 'Giá không được âm')
  .max(MAX_PRODUCT_PRICE, 'Giá quá lớn')

const ProductQueryBaseSchema = paginationQuerySchema.extend({
  search: searchQuerySchema.optional(),
  // Slug danh mục, vd: binh-hoa. Để trống = mọi danh mục
  category: z
    .string()
    .trim()
    .max(100)
    .regex(/^[a-z0-9-]*$/, 'Danh mục không hợp lệ')
    .transform((value) => value || undefined)
    .optional(),
  minPrice: priceQuerySchema.optional(),
  maxPrice: priceQuerySchema.optional(),
  // true = chỉ lấy sản phẩm còn hàng
  inStock: z.stringbool('Giá trị inStock không hợp lệ').optional(),
  sort: productSortSchema
})

export const ProductQuerySchema = ProductQueryBaseSchema.refine(
  (query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice,
  { message: 'Giá tối thiểu không được lớn hơn giá tối đa', path: ['minPrice'] }
)

export type ProductQuery = z.infer<typeof ProductQuerySchema>
