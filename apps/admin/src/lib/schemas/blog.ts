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
