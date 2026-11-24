import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import {
  AdminReviewQuerySchema,
  CreateReviewBodySchema,
  ModerateReviewBodySchema,
  ProductReviewQuerySchema,
  UpdateReviewBodySchema
} from '@modules/review/dto'

import {
  RatingSummarySchema,
  ReviewItemSchema,
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  nullSuccessResponse,
  paginatedWrapper,
  jsonBody,
  notFoundResponse,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-24: Đánh giá sản phẩm ────────────────────────────────────────────────

const TAG = 'Đánh giá sản phẩm (US-24)'

const slugParam = z.object({ slug: z.string().meta({ example: 'binh-hoa-men-lam-ve-sen' }) })
const unauthorized = unauthorizedResponse('Chưa đăng nhập hoặc access token hết hạn')

registry.registerPath({
  method: 'get',
  path: '/products/{slug}/reviews',
  tags: [TAG],
  summary: 'Đánh giá của sản phẩm',
  description:
    'Đánh giá đang hiện, mới nhất lên trước; lọc theo số sao (`rating`). `summary` là điểm trung bình và số đánh giá theo từng mức sao.',
  request: { params: slugParam, query: ProductReviewQuerySchema },
  responses: {
    200: {
      description: 'Đánh giá',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({
              limit: z.number().int().meta({ example: 5 }),
              offset: z.number().int().meta({ example: 0 }),
              total_count: z.number().int().meta({ example: 12 }),
              entries: z.array(ReviewItemSchema),
              summary: RatingSummarySchema
            }),
            '/products/binh-hoa-men-lam-ve-sen/reviews'
          )
        }
      }
    },
    404: notFoundResponse('Không tìm thấy sản phẩm'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/products/{slug}/reviews/me',
  tags: [TAG],
  summary: 'Đánh giá của tôi cho sản phẩm',
  description:
    '`canReview = true` khi đã nhận hàng (đơn đã giao có sản phẩm này) và chưa đánh giá; đã đánh giá thì trả kèm `review` để sửa.',
  security: [{ bearerAuth: [] }],
  request: { params: slugParam },
  responses: {
    200: {
      description: 'Trạng thái đánh giá',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({
              canReview: z.boolean().meta({ example: true }),
              reason: z.string().nullable().meta({ example: null }),
              review: ReviewItemSchema.extend({ isHidden: z.boolean() }).nullable()
            }),
            '/products/binh-hoa-men-lam-ve-sen/reviews/me'
          )
        }
      }
    },
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy sản phẩm')
  }
})

registry.registerPath({
  method: 'post',
  path: '/reviews',
  tags: [TAG],
  summary: 'Đánh giá sản phẩm',
  description:
    'Chỉ khách đã nhận hàng (có đơn đã giao chứa sản phẩm). Mỗi tài khoản một đánh giá cho mỗi sản phẩm — muốn đổi thì sửa đánh giá cũ.',
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreateReviewBodySchema),
  responses: {
    201: {
      description: 'Đã đánh giá',
      content: {
        'application/json': {
          schema: successWrapper(ReviewItemSchema, '/reviews', 201, 'Cảm ơn bạn đã đánh giá sản phẩm')
        }
      }
    },
    400: badRequestResponse('Chỉ khách đã mua và nhận sản phẩm này mới đánh giá được'),
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy sản phẩm'),
    409: conflictResponse('Bạn đã đánh giá sản phẩm này rồi'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/reviews/{id}',
  tags: [TAG],
  summary: 'Sửa đánh giá của tôi',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(UpdateReviewBodySchema) },
  responses: {
    200: {
      description: 'Đã cập nhật',
      content: {
        'application/json': { schema: successWrapper(ReviewItemSchema, '/reviews/{id}', 200, 'Đã cập nhật đánh giá') }
      }
    },
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy đánh giá'),
    422: validationErrorResponse()
  }
})

// ─── US-25: Quản lý đánh giá (admin) ─────────────────────────────────────────

const ADMIN_TAG = 'Admin - Đánh giá (US-25)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

const AdminReviewSchema = registry.register(
  'AdminReviewItem',
  ReviewItemSchema.extend({
    isHidden: z.boolean().meta({ example: false }),
    product: z.object({
      id: z.string().uuid(),
      name: z.string().meta({ example: 'Cốc cà phê men xanh rêu' }),
      slug: z.string().meta({ example: 'coc-ca-phe-men-xanh-reu' }),
      imageUrl: z.string().url().nullable()
    }),
    customer: z.object({
      id: z.string().uuid(),
      fullName: z.string().meta({ example: 'Nguyễn Văn An' }),
      email: z.string().email().meta({ example: 'nguyenvanan@gmail.com' })
    }),
    orderCode: z.string().nullable().meta({ example: 'DH7K3M9Q', description: 'Đơn đã giao chứng minh khách đã mua' })
  })
)

registry.registerPath({
  method: 'get',
  path: '/admin/reviews',
  tags: [ADMIN_TAG],
  summary: 'Danh sách đánh giá',
  description:
    'Mới nhất lên trước, gồm cả đánh giá đã ẩn. Tìm theo nhận xét, tên sản phẩm, tên / email khách; lọc theo số sao, trạng thái (`visible` / `hidden`) và sản phẩm.',
  security: [{ bearerAuth: [] }],
  request: { query: AdminReviewQuerySchema },
  responses: {
    200: {
      description: 'Danh sách đánh giá',
      content: { 'application/json': { schema: paginatedWrapper(AdminReviewSchema, '/admin/reviews') } }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/reviews/{id}',
  tags: [ADMIN_TAG],
  summary: 'Ẩn / hiện đánh giá, trả lời khách',
  description: `- \`isHidden\`: đánh giá ẩn không hiện ở trang sản phẩm và không tính vào điểm trung bình
- \`adminReply\`: phản hồi hiện dưới đánh giá; \`null\` hoặc chuỗi rỗng để xoá; đổi nội dung thì cập nhật \`repliedAt\``,
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(ModerateReviewBodySchema) },
  responses: {
    200: {
      description: 'Đã cập nhật',
      content: {
        'application/json': { schema: successWrapper(AdminReviewSchema, '/admin/reviews/{id}', 200, 'Đã lưu phản hồi') }
      }
    },
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy đánh giá'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/admin/reviews/{id}',
  tags: [ADMIN_TAG],
  summary: 'Xoá đánh giá',
  description: 'Dùng cho đánh giá spam; khách có thể đánh giá lại sản phẩm.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: nullSuccessResponse('/admin/reviews/{id}', 'Đã xoá đánh giá'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy đánh giá'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})
