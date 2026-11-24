import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import { AdminPostQuerySchema, CreatePostBodySchema, UpdatePostBodySchema } from '@modules/post/dto'

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
