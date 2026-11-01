import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import { CreateCategoryBodySchema, UpdateCategoryBodySchema } from '@modules/category/dto'

import {
  CategoryItemSchema,
  conflictResponse,
  forbiddenResponse,
  jsonBody,
  notFoundResponse,
  nullSuccessResponse,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-07: Quản lý danh mục (admin) ─────────────────────────────────────────

const ADMIN_TAG = 'Admin - Danh mục (US-07)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

registry.registerPath({
  method: 'get',
  path: '/admin/categories',
  tags: [ADMIN_TAG],
  summary: 'Danh sách danh mục (gồm cả danh mục đang ẩn)',
  description: 'Sắp xếp theo tên. `productCount` đếm mọi sản phẩm chưa xoá trong danh mục, kể cả sản phẩm đang ẩn.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Danh sách danh mục',
      content: { 'application/json': { schema: successWrapper(z.array(CategoryItemSchema), '/admin/categories') } }
    },
    ...adminErrors
  }
})

registry.registerPath({
  method: 'post',
  path: '/admin/categories',
  tags: [ADMIN_TAG],
  summary: 'Thêm danh mục',
  description: 'Slug được sinh từ tên (bỏ dấu). Hai danh mục không được trùng tên (không phân biệt hoa thường, dấu).',
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreateCategoryBodySchema),
  responses: {
    201: {
      description: 'Thêm thành công',
      content: {
        'application/json': {
          schema: successWrapper(CategoryItemSchema, '/admin/categories', 201, 'Đã thêm danh mục')
        }
      }
    },
    ...adminErrors,
    409: conflictResponse('Đã có danh mục với tên này'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/categories/{id}',
  tags: [ADMIN_TAG],
  summary: 'Cập nhật danh mục',
  description: 'Chỉ cập nhật các trường được gửi lên. Đổi tên thì slug đổi theo. Gửi `isActive: false` để ẩn danh mục.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(UpdateCategoryBodySchema) },
  responses: {
    200: {
      description: 'Cập nhật thành công',
      content: {
        'application/json': {
          schema: successWrapper(CategoryItemSchema, '/admin/categories/{id}', 200, 'Đã cập nhật danh mục')
        }
      }
    },
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy danh mục'),
    409: conflictResponse('Đã có danh mục với tên này'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/admin/categories/{id}',
  tags: [ADMIN_TAG],
  summary: 'Xoá danh mục',
  description: 'Chỉ xoá được danh mục không còn sản phẩm nào.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: nullSuccessResponse('/admin/categories/{id}', 'Đã xoá danh mục'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy danh mục'),
    409: conflictResponse('Danh mục đang có sản phẩm'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})
