import { z } from 'zod/v4'

import {
  MAX_ADMIN_REPLY_LENGTH,
  MAX_RATING,
  MAX_REVIEW_COMMENT_LENGTH,
  MIN_RATING,
  REVIEW_STATUS
} from '@common/constants'
import { optionalTextSchema, paginationQuerySchema, searchQuerySchema, uuidSchema } from '@common/validators'

const ratingSchema = z
  .number('Số sao phải là số')
  .int('Số sao phải là số nguyên')
  .min(MIN_RATING, `Chọn từ ${MIN_RATING} đến ${MAX_RATING} sao`)
  .max(MAX_RATING, `Chọn từ ${MIN_RATING} đến ${MAX_RATING} sao`)

const commentSchema = optionalTextSchema('Nhận xét', MAX_REVIEW_COMMENT_LENGTH).nullable().optional()

// US-24: Khách đánh giá sản phẩm đã mua
const CreateReviewBodyBaseSchema = z.object({
  productId: uuidSchema,
  rating: ratingSchema,
  comment: commentSchema
})

export const CreateReviewBodyExample = {
  productId: '9f1e2d3c-4b5a-4678-9abc-def012345678',
  rating: 5,
  comment: 'Men lam rất đẹp, đóng gói cẩn thận, giao nhanh.'
} satisfies z.input<typeof CreateReviewBodyBaseSchema>

export const CreateReviewBodySchema = CreateReviewBodyBaseSchema.meta({ example: CreateReviewBodyExample })

export type CreateReviewBody = z.infer<typeof CreateReviewBodySchema>

const UpdateReviewBodyBaseSchema = z.object({
  rating: ratingSchema.optional(),
  comment: commentSchema
})

export const UpdateReviewBodySchema = UpdateReviewBodyBaseSchema.refine(
  (data) => data.rating !== undefined || data.comment !== undefined,
  'Không có thông tin nào để cập nhật'
).meta({ example: { rating: 4 } })

export type UpdateReviewBody = z.infer<typeof UpdateReviewBodySchema>

// US-24: Đánh giá của một sản phẩm — mới nhất lên trước
export const ProductReviewQuerySchema = paginationQuerySchema.extend({
  rating: z.coerce.number().int().min(MIN_RATING).max(MAX_RATING).optional()
})

export type ProductReviewQuery = z.infer<typeof ProductReviewQuerySchema>

// US-25: Quản lý đánh giá (admin) — mới nhất lên trước
export const AdminReviewQuerySchema = paginationQuerySchema.extend({
  // Nội dung nhận xét, tên sản phẩm, tên hoặc email khách
  search: searchQuerySchema.optional(),
  rating: z.coerce.number().int().min(MIN_RATING).max(MAX_RATING).optional(),
  status: z.enum(REVIEW_STATUS, 'Trạng thái không hợp lệ').optional(),
  productId: uuidSchema.optional()
})

export type AdminReviewQuery = z.infer<typeof AdminReviewQuerySchema>

// US-25: Ẩn / hiện đánh giá, trả lời khách (null hoặc chuỗi rỗng để xoá phản hồi)
const ModerateReviewBodyBaseSchema = z.object({
  isHidden: z.boolean('Trạng thái ẩn không hợp lệ').optional(),
  adminReply: optionalTextSchema('Phản hồi', MAX_ADMIN_REPLY_LENGTH).nullable().optional()
})

export const ModerateReviewBodyExample = {
  adminReply: 'Cảm ơn anh đã tin chọn Gốm Sứ Xanh, hẹn gặp lại anh ở workshop!'
} satisfies z.input<typeof ModerateReviewBodyBaseSchema>

export const ModerateReviewBodySchema = ModerateReviewBodyBaseSchema.refine(
  (data) => data.isHidden !== undefined || data.adminReply !== undefined,
  'Không có thông tin nào để cập nhật'
).meta({ example: ModerateReviewBodyExample })

export type ModerateReviewBody = z.infer<typeof ModerateReviewBodySchema>
