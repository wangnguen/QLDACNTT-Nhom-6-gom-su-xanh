import { z } from 'zod/v4'

import { MAX_POST_CONTENT_LENGTH, POST_STATUS } from '@common/constants'
import { catalogNameSchema, imageUrlSchema, optionalTextSchema, uuidSchema } from '@common/validators'

export const PostBodyFields = {
  title: catalogNameSchema('Tiêu đề', 255),
  excerpt: optionalTextSchema('Tóm tắt', 500),
  content: z
    .string('Vui lòng nhập nội dung')
    .trim()
    .min(20, 'Nội dung tối thiểu 20 ký tự')
    .max(MAX_POST_CONTENT_LENGTH, `Nội dung tối đa ${MAX_POST_CONTENT_LENGTH.toLocaleString('vi-VN')} ký tự`),
  coverImageUrl: imageUrlSchema.nullable(),
  categoryId: uuidSchema,
  status: z.enum(POST_STATUS, 'Trạng thái chỉ được là draft hoặc published')
}

const CreatePostBodyBaseSchema = z.object({
  title: PostBodyFields.title,
  excerpt: PostBodyFields.excerpt.nullable().optional(),
  content: PostBodyFields.content,
  coverImageUrl: PostBodyFields.coverImageUrl.optional(),
  categoryId: PostBodyFields.categoryId,
  // Mặc định lưu nháp
  status: PostBodyFields.status.default(POST_STATUS.DRAFT)
})

export const CreatePostBodyExample = {
  title: 'Phân biệt men lam và men rạn Bát Tràng',
  excerpt: 'Hai dòng men nổi tiếng nhất của làng gốm và cách nhận biết bằng mắt thường.',
  content:
    'Men lam là lớp men trong phủ trên hoạ tiết vẽ bằng ô-xít coban.\n\n## Men rạn\n\nMen rạn tạo các vết nứt nhỏ trên bề mặt do co ngót khi nung.',
  coverImageUrl: 'https://example.com/images/men-lam.jpg',
  categoryId: 'd4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f70',
  status: 'published'
} satisfies z.input<typeof CreatePostBodyBaseSchema>

export const CreatePostBodySchema = CreatePostBodyBaseSchema.meta({ example: CreatePostBodyExample })

export type CreatePostBody = z.infer<typeof CreatePostBodySchema>
