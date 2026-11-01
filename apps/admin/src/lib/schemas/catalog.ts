import { z } from 'zod'

// Giới hạn khớp với server (US-07)
export const MAX_PRODUCT_IMAGES = 8
const MAX_PRODUCT_PRICE = 1_000_000_000
const MAX_PRODUCT_STOCK = 100_000

const IMAGE_URL_MESSAGE = 'Link ảnh phải là địa chỉ http:// hoặc https:// có tên miền'
const isImageUrl = (value: string) => z.httpUrl().safeParse(value).success

// Tên dùng để sinh đường dẫn nên phải có chữ cái hoặc chữ số (giống server)
const hasLetterOrDigit = (value: string) => /[\p{L}\p{N}]/u.test(value)

const nameField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Vui lòng nhập ${label.toLowerCase()}`)
    .max(max, `${label} tối đa ${max} ký tự`)
    .refine(hasLetterOrDigit, `${label} phải chứa chữ cái hoặc chữ số`)

const textField = (label: string, max: number) => z.string().trim().max(max, `${label} tối đa ${max} ký tự`)

// '' = không có ảnh → gửi null lên server
const optionalImageUrlField = z
  .string()
  .trim()
  .max(2048, 'Link ảnh tối đa 2048 ký tự')
  .refine((value) => value === '' || isImageUrl(value), IMAGE_URL_MESSAGE)

export const categoryFormSchema = z.object({
  name: nameField('Tên danh mục', 100),
  description: textField('Mô tả', 1000),
  imageUrl: optionalImageUrlField,
  isActive: z.boolean()
})

// Ô số dùng valueAsNumber: để trống → NaN → báo "Vui lòng nhập ..."
const integerField = (label: string, min: number, max: number) =>
  z
    .number(`Vui lòng nhập ${label.toLowerCase()}`)
    .int(`${label} phải là số nguyên`)
    .min(min, min > 0 ? `${label} phải lớn hơn 0` : `${label} không được âm`)
    .max(max, `${label} tối đa ${max.toLocaleString('vi-VN')}`)

export const productFormSchema = z.object({
  name: nameField('Tên sản phẩm', 255),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  price: integerField('Giá bán', 1, MAX_PRODUCT_PRICE),
  stock: integerField('Tồn kho', 0, MAX_PRODUCT_STOCK),
  material: textField('Chất liệu', 100),
  dimensions: textField('Kích thước', 100),
  description: textField('Mô tả', 5000),
  // useFieldArray cần mảng object
  images: z
    .array(
      z.object({
        url: z
          .string()
          .trim()
          .min(1, 'Vui lòng nhập link ảnh hoặc xoá ô này')
          .max(2048, 'Link ảnh tối đa 2048 ký tự')
          .refine(isImageUrl, IMAGE_URL_MESSAGE)
      })
    )
    .max(MAX_PRODUCT_IMAGES, `Tối đa ${MAX_PRODUCT_IMAGES} ảnh`)
    .refine(
      (images) => new Set(images.map((image) => image.url.trim())).size === images.length,
      'Có link ảnh bị trùng'
    ),
  isActive: z.boolean()
})

export type CategoryFormInput = z.infer<typeof categoryFormSchema>
export type ProductFormInput = z.infer<typeof productFormSchema>
