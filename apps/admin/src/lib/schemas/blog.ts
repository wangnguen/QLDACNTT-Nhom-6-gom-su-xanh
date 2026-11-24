import { z } from 'zod'

// Tên dùng để sinh đường dẫn nên phải có chữ cái hoặc chữ số (giống server)
const hasLetterOrDigit = (value: string) => /[\p{L}\p{N}]/u.test(value)

export const postCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên danh mục')
    .max(100, 'Tên danh mục tối đa 100 ký tự')
    .refine(hasLetterOrDigit, 'Tên danh mục phải chứa chữ cái hoặc chữ số'),
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự'),
  isActive: z.boolean()
})

export type PostCategoryFormInput = z.infer<typeof postCategoryFormSchema>

const IMAGE_URL_MESSAGE = 'Link ảnh phải là địa chỉ http:// hoặc https:// có tên miền'

export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tiêu đề')
    .max(255, 'Tiêu đề tối đa 255 ký tự')
    .refine(hasLetterOrDigit, 'Tiêu đề phải chứa chữ cái hoặc chữ số'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  excerpt: z.string().trim().max(500, 'Tóm tắt tối đa 500 ký tự'),
  coverImageUrl: z
    .string()
    .trim()
    .max(2048, 'Link ảnh tối đa 2048 ký tự')
    .refine((value) => value === '' || z.httpUrl().safeParse(value).success, IMAGE_URL_MESSAGE),
  content: z.string().trim().min(20, 'Nội dung tối thiểu 20 ký tự').max(50_000, 'Nội dung tối đa 50.000 ký tự')
})

export type PostFormInput = z.infer<typeof postFormSchema>
