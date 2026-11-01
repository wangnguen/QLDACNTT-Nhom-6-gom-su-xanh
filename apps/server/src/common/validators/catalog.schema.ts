import { z } from 'zod/v4'

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@common/constants'
import { slugify } from '@common/utils/slug'

export const uuidSchema = z.uuid('ID không hợp lệ')

export const idParamSchema = z.object({ id: uuidSchema })

// Tên dùng để sinh slug cho URL nên phải có ít nhất một chữ cái hoặc chữ số. `label` viết hoa chữ đầu, vd 'Tên sản phẩm'
export const catalogNameSchema = (label: string, max: number) =>
  z
    .string(`Vui lòng nhập ${label.toLowerCase()}`)
    .trim()
    .min(1, `Vui lòng nhập ${label.toLowerCase()}`)
    .max(max, `${label} tối đa ${max} ký tự`)
    .refine((value) => slugify(value) !== '', `${label} phải chứa chữ cái hoặc chữ số`)

export const imageUrlSchema = z
  .string()
  .trim()
  .max(2048, 'Link ảnh tối đa 2048 ký tự')
  .pipe(z.httpUrl('Link ảnh phải là URL bắt đầu bằng http:// hoặc https://'))

// Chuỗi rỗng = xoá nội dung
export const optionalTextSchema = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} tối đa ${max} ký tự`)
    .transform((value) => value || null)

export const paginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT, `Mỗi trang tối đa ${MAX_PAGE_LIMIT} mục`)
    .default(DEFAULT_PAGE_LIMIT),
  offset: z.coerce.number().int().min(0).default(0)
})

// Ô tìm kiếm để trống thì bỏ qua bộ lọc
export const searchQuerySchema = z
  .string()
  .trim()
  .max(100, 'Từ khoá tìm kiếm tối đa 100 ký tự')
  .transform((value) => value || undefined)
