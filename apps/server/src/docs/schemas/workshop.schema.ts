import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import {
  AdminWorkshopQuerySchema,
  CreateWorkshopBodySchema,
  UpdateWorkshopBodySchema,
  WorkshopQuerySchema
} from '@modules/workshop/dto'

import {
  WorkshopDetailSchema,
  WorkshopSummarySchema,
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  jsonBody,
  notFoundResponse,
  nullSuccessResponse,
  paginatedWrapper,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-12: Xem danh sách và chi tiết lớp workshop ───────────────────────────

const PUBLIC_TAG = 'Workshop - Danh sách (US-12)'

registry.registerPath({
  method: 'get',
  path: '/workshops',
  tags: [PUBLIC_TAG],
  summary: 'Danh sách lớp workshop sắp diễn ra',
  description: `Không cần đăng nhập. Chỉ trả về lớp đang mở và chưa bắt đầu. Phân trang bằng \`limit\`/\`offset\`.

- \`search\`: tìm theo tên lớp, gõ có dấu hoặc không dấu đều được
- \`from\`/\`to\`: lớp bắt đầu trong khoảng ngày (YYYY-MM-DD, giờ Việt Nam, tính cả hai ngày)
- \`availableOnly=true\`: chỉ lớp còn nhận đăng ký (chưa qua hạn và còn chỗ)
- \`sort\`: \`start_asc\` (mặc định), \`start_desc\`, \`price_asc\`, \`price_desc\`, \`newest\``,
  request: { query: WorkshopQuerySchema },
  responses: {
    200: {
      description: 'Danh sách lớp',
      content: { 'application/json': { schema: paginatedWrapper(WorkshopSummarySchema, '/workshops') } }
    },
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/workshops/{slug}',
  tags: [PUBLIC_TAG],
  summary: 'Chi tiết lớp workshop',
  description:
    'Không cần đăng nhập. Lớp đang ẩn hoặc đã xoá trả 404. Lớp đã diễn ra vẫn xem được với `availability: closed`.',
  request: {
    params: z.object({ slug: z.string().meta({ example: 'lop-vuot-gom-tren-ban-xoay-co-ban' }) })
  },
  responses: {
    200: {
      description: 'Chi tiết lớp',
      content: { 'application/json': { schema: successWrapper(WorkshopDetailSchema, '/workshops/{slug}') } }
    },
    404: notFoundResponse('Không tìm thấy lớp workshop')
  }
})

// ─── US-11: Quản lý lớp workshop (admin) ─────────────────────────────────────

const ADMIN_TAG = 'Admin - Lớp workshop (US-11)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

const scheduleRules = `Quy tắc thời gian (ISO 8601 có múi giờ, vd \`2026-12-05T09:00:00+07:00\`):
- \`endsAt\` sau \`startsAt\`, mỗi lớp dài tối đa 12 tiếng
- \`registrationDeadline\` không sau \`startsAt\`; \`null\` = nhận đăng ký tới giờ bắt đầu`

registry.registerPath({
  method: 'get',
  path: '/admin/workshops',
  tags: [ADMIN_TAG],
  summary: 'Danh sách lớp workshop (gồm cả lớp đang ẩn, đã kết thúc)',
  description: `Phân trang bằng \`limit\`/\`offset\`.

- \`search\`: tìm theo tên lớp, gõ có dấu hoặc không dấu đều được
- \`status\`: \`active\` (đang mở) hoặc \`hidden\` (đang ẩn)
- \`time\`: \`upcoming\` (chưa kết thúc) hoặc \`past\` (đã kết thúc)
- \`sort\`: \`start_asc\` (mặc định), \`start_desc\`, \`price_asc\`, \`price_desc\`, \`newest\``,
  security: [{ bearerAuth: [] }],
  request: { query: AdminWorkshopQuerySchema },
  responses: {
    200: {
      description: 'Danh sách lớp',
      content: { 'application/json': { schema: paginatedWrapper(WorkshopSummarySchema, '/admin/workshops') } }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/admin/workshops/{id}',
  tags: [ADMIN_TAG],
  summary: 'Chi tiết lớp workshop (để sửa)',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Chi tiết lớp',
      content: { 'application/json': { schema: successWrapper(WorkshopDetailSchema, '/admin/workshops/{id}') } }
    },
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy lớp workshop'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})

registry.registerPath({
  method: 'post',
  path: '/admin/workshops',
  tags: [ADMIN_TAG],
  summary: 'Thêm lớp workshop',
  description: `${scheduleRules}
- \`startsAt\` phải ở tương lai

Ảnh là link dán vào (tối đa 8, ảnh đầu tiên là ảnh đại diện). Slug được sinh từ tên, trùng thì thêm hậu tố \`-2\`, \`-3\`...`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreateWorkshopBodySchema),
  responses: {
    201: {
      description: 'Thêm thành công',
      content: {
        'application/json': {
          schema: successWrapper(WorkshopDetailSchema, '/admin/workshops', 201, 'Đã thêm lớp workshop')
        }
      }
    },
    400: badRequestResponse('Thời gian không hợp lệ'),
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/workshops/{id}',
  tags: [ADMIN_TAG],
  summary: 'Cập nhật lớp workshop',
  description: `Chỉ cập nhật các trường được gửi lên. \`imageUrls\` gửi lên sẽ thay toàn bộ danh sách ảnh cũ. Gửi \`isActive: false\` để ẩn lớp.

${scheduleRules}
- Dời \`startsAt\` thì giờ mới phải ở tương lai

\`capacity\` không được nhỏ hơn số chỗ khách đã đặt (\`bookedSeats\`).`,
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(UpdateWorkshopBodySchema) },
  responses: {
    200: {
      description: 'Cập nhật thành công',
      content: {
        'application/json': {
          schema: successWrapper(WorkshopDetailSchema, '/admin/workshops/{id}', 200, 'Đã cập nhật lớp workshop')
        }
      }
    },
    400: badRequestResponse('Thời gian không hợp lệ / số chỗ nhỏ hơn số chỗ đã đặt'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy lớp workshop'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/admin/workshops/{id}',
  tags: [ADMIN_TAG],
  summary: 'Xoá lớp workshop',
  description: 'Lớp đã có lượt đăng ký (kể cả đã huỷ) không xoá được, chỉ ẩn được (`isActive: false`).',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: nullSuccessResponse('/admin/workshops/{id}', 'Đã xoá lớp workshop'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy lớp workshop'),
    409: conflictResponse('Lớp đã có lượt đăng ký nên không xoá được'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})
