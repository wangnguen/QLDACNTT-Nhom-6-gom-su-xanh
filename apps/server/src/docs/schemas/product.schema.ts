import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import { AdminProductQuerySchema, CreateProductBodySchema, UpdateProductBodySchema } from '@modules/product/dto'

import {
  ProductDetailSchema,
  ProductSummarySchema,
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

// ─── US-07: Quản lý sản phẩm (admin) ─────────────────────────────────────────

const ADMIN_TAG = 'Admin - Sản phẩm (US-07)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

registry.registerPath({
  method: 'get',
  path: '/admin/products',
  tags: [ADMIN_TAG],
  summary: 'Danh sách sản phẩm (gồm cả sản phẩm đang ẩn)',
  description: `Phân trang bằng \`limit\`/\`offset\`.

- \`search\`: tìm theo tên, gõ có dấu hoặc không dấu đều được
- \`status\`: \`active\` (đang bán) hoặc \`hidden\` (đang ẩn), bỏ trống để lấy tất cả
- \`sort\`: \`newest\` (mặc định), \`price_asc\`, \`price_desc\`, \`name_asc\``,
  security: [{ bearerAuth: [] }],
  request: { query: AdminProductQuerySchema },
  responses: {
    200: {
      description: 'Danh sách sản phẩm',
      content: { 'application/json': { schema: paginatedWrapper(ProductSummarySchema, '/admin/products') } }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/admin/products/{id}',
  tags: [ADMIN_TAG],
  summary: 'Chi tiết sản phẩm (để sửa)',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Chi tiết sản phẩm',
      content: { 'application/json': { schema: successWrapper(ProductDetailSchema, '/admin/products/{id}') } }
    },
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy sản phẩm'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})

registry.registerPath({
  method: 'post',
  path: '/admin/products',
  tags: [ADMIN_TAG],
  summary: 'Thêm sản phẩm',
  description: `Ảnh là link dán vào (\`http://\` hoặc \`https://\`), tối đa 8 ảnh; ảnh đầu tiên là ảnh đại diện.

Slug được sinh từ tên, trùng thì thêm hậu tố \`-2\`, \`-3\`...`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreateProductBodySchema),
  responses: {
    201: {
      description: 'Thêm thành công',
      content: {
        'application/json': {
          schema: successWrapper(ProductDetailSchema, '/admin/products', 201, 'Đã thêm sản phẩm')
        }
      }
    },
    400: badRequestResponse('Danh mục không tồn tại'),
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/products/{id}',
  tags: [ADMIN_TAG],
  summary: 'Cập nhật sản phẩm',
  description:
    'Chỉ cập nhật các trường được gửi lên. `imageUrls` gửi lên sẽ thay toàn bộ danh sách ảnh cũ. Gửi `isActive: false` để ẩn sản phẩm.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(UpdateProductBodySchema) },
  responses: {
    200: {
      description: 'Cập nhật thành công',
      content: {
        'application/json': {
          schema: successWrapper(ProductDetailSchema, '/admin/products/{id}', 200, 'Đã cập nhật sản phẩm')
        }
      }
    },
    400: badRequestResponse('Danh mục không tồn tại'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy sản phẩm'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/admin/products/{id}',
  tags: [ADMIN_TAG],
  summary: 'Xoá sản phẩm',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: nullSuccessResponse('/admin/products/{id}', 'Đã xoá sản phẩm'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy sản phẩm'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})
