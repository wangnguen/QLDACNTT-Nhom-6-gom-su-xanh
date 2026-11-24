import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import { AdminPostQuerySchema, CreatePostBodySchema, PostQuerySchema, UpdatePostBodySchema } from '@modules/post/dto'

import {
  PostDetailSchema,
  PostSummarySchema,
  badRequestResponse,
  forbiddenResponse,
  jsonBody,
  notFoundResponse,
  nullSuccessResponse,
  paginatedWrapper,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-22: Quản lý bài viết ─────────────────────────────────────────────────

const ADMIN_TAG = 'Admin - Bài viết (US-22)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

const detailResponse = (path: string, status: number, message: string) => ({
  description: message,
  content: { 'application/json': { schema: successWrapper(PostDetailSchema, path, status, message) } }
})

registry.registerPath({
  method: 'get',
  path: '/admin/posts',
  tags: [ADMIN_TAG],
  summary: 'Danh sách bài viết',
  description: 'Gồm cả bản nháp, mới sửa lên trước. Tìm theo tiêu đề, lọc theo danh mục và trạng thái.',
  security: [{ bearerAuth: [] }],
  request: { query: AdminPostQuerySchema },
  responses: {
    200: {
      description: 'Danh sách bài viết',
      content: { 'application/json': { schema: paginatedWrapper(PostSummarySchema, '/admin/posts') } }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/admin/posts/{id}',
  tags: [ADMIN_TAG],
  summary: 'Chi tiết bài viết (để sửa)',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: detailResponse('/admin/posts/{id}', 200, 'OK'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy bài viết'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})

registry.registerPath({
  method: 'post',
  path: '/admin/posts',
  tags: [ADMIN_TAG],
  summary: 'Viết bài mới',
  description: `- Slug sinh từ tiêu đề, trùng thì thêm hậu tố -2, -3...
- \`status\` mặc định \`draft\`; \`published\` thì ghi thời điểm đăng ngay
- Người viết là tài khoản admin đang đăng nhập`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreatePostBodySchema),
  responses: {
    201: detailResponse('/admin/posts', 201, 'Đã đăng bài'),
    400: badRequestResponse('Danh mục bài viết không tồn tại'),
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/posts/{id}',
  tags: [ADMIN_TAG],
  summary: 'Sửa bài viết / đăng / gỡ bài',
  description: `Chỉ cập nhật các trường được gửi. Đổi tiêu đề thì sinh slug mới.

- Nháp → \`published\`: ghi thời điểm đăng là lúc này
- Đã đăng → \`draft\`: gỡ bài khỏi trang tin tức`,
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(UpdatePostBodySchema) },
  responses: {
    200: detailResponse('/admin/posts/{id}', 200, 'Đã cập nhật bài viết'),
    400: badRequestResponse('Danh mục bài viết không tồn tại'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy bài viết'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/admin/posts/{id}',
  tags: [ADMIN_TAG],
  summary: 'Xoá bài viết',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: nullSuccessResponse('/admin/posts/{id}', 'Đã xoá bài viết'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy bài viết'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})

// ─── US-23: Xem tin tức / blog ───────────────────────────────────────────────

const TAG = 'Tin tức - Bài viết (US-23)'

registry.registerPath({
  method: 'get',
  path: '/posts',
  tags: [TAG],
  summary: 'Danh sách bài viết',
  description:
    'Chỉ bài đã đăng thuộc danh mục đang hiện, mới đăng lên trước. Lọc theo `category` (slug danh mục) và `search` (tiêu đề, có dấu hoặc không dấu).',
  request: { query: PostQuerySchema },
  responses: {
    200: {
      description: 'Danh sách bài viết',
      content: { 'application/json': { schema: paginatedWrapper(PostSummarySchema, '/posts') } }
    },
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/posts/{slug}',
  tags: [TAG],
  summary: 'Đọc bài viết',
  description:
    'Kèm tối đa 3 bài cùng danh mục (`related`). Mỗi lần mở bài cộng một lượt xem. Bài nháp, bài thuộc danh mục đang ẩn trả 404.',
  request: { params: z.object({ slug: z.string().meta({ example: 'phan-biet-men-lam-va-men-ran-bat-trang' }) }) },
  responses: {
    200: {
      description: 'Bài viết',
      content: {
        'application/json': {
          schema: successWrapper(
            PostDetailSchema.extend({ related: z.array(PostSummarySchema) }),
            '/posts/phan-biet-men-lam-va-men-ran-bat-trang'
          )
        }
      }
    },
    404: notFoundResponse('Không tìm thấy bài viết')
  }
})
