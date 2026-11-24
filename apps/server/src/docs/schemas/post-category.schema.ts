import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import { CreatePostCategoryBodySchema, UpdatePostCategoryBodySchema } from '@modules/post-category/dto'

import {
  PostCategoryItemSchema,
  conflictResponse,
  forbiddenResponse,
  jsonBody,
  nullSuccessResponse,
  notFoundResponse,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-21: Danh mục bài viết ────────────────────────────────────────────────

const TAG = 'Tin tức - Danh mục (US-21)'
const ADMIN_TAG = 'Admin - Danh mục bài viết (US-21)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

const itemResponse = (path: string, status: number, message: string) => ({
  description: message,
  content: { 'application/json': { schema: successWrapper(PostCategoryItemSchema, path, status, message) } }
})

registry.registerPath({
  method: 'get',
  path: '/post-categories',
  tags: [TAG],
  summary: 'Danh mục bài viết đang hiện',
  description: 'Sắp theo tên, dùng cho bộ lọc ở trang tin tức.',
  responses: {
    200: {
      description: 'Danh sách danh mục',
      content: {
        'application/json': { schema: successWrapper(z.array(PostCategoryItemSchema), '/post-categories') }
      }
    }
  }
})

registry.registerPath({
  method: 'get',
  path: '/admin/post-categories',
  tags: [ADMIN_TAG],
  summary: 'Danh sách danh mục bài viết',
  description: 'Gồm cả danh mục đang ẩn.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Danh sách danh mục',
      content: {
        'application/json': { schema: successWrapper(z.array(PostCategoryItemSchema), '/admin/post-categories') }
      }
    },
    ...adminErrors
  }
})

registry.registerPath({
  method: 'post',
  path: '/admin/post-categories',
  tags: [ADMIN_TAG],
  summary: 'Thêm danh mục bài viết',
  description: 'Slug sinh từ tên; tên trùng danh mục khác (không phân biệt hoa thường, dấu) trả 409.',
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreatePostCategoryBodySchema),
  responses: {
    201: itemResponse('/admin/post-categories', 201, 'Đã thêm danh mục bài viết'),
    ...adminErrors,
    409: conflictResponse('Đã có danh mục bài viết với tên này'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/post-categories/{id}',
  tags: [ADMIN_TAG],
  summary: 'Sửa danh mục bài viết',
  description: 'Chỉ cập nhật các trường được gửi. Ẩn danh mục thì các bài viết trong đó cũng ẩn ở trang client.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(UpdatePostCategoryBodySchema) },
  responses: {
    200: itemResponse('/admin/post-categories/{id}', 200, 'Đã cập nhật danh mục bài viết'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy danh mục bài viết'),
    409: conflictResponse('Đã có danh mục bài viết với tên này'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/admin/post-categories/{id}',
  tags: [ADMIN_TAG],
  summary: 'Xoá danh mục bài viết',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: nullSuccessResponse('/admin/post-categories/{id}', 'Đã xoá danh mục bài viết'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy danh mục bài viết'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})
