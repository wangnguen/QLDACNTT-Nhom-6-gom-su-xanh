import { registry } from '@docs/registry'

import {
  AdminRegistrationQuerySchema,
  CancelRegistrationBodySchema,
  CreateRegistrationBodySchema,
  MyRegistrationQuerySchema,
  RegistrationIdParamSchema,
  UpdateRegistrationStatusBodySchema
} from '@modules/workshop-registration/dto'

import {
  WorkshopRegistrationSchema,
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  jsonBody,
  notFoundResponse,
  paginatedWrapper,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-12: Đăng ký workshop ─────────────────────────────────────────────────

const TAG = 'Workshop - Đăng ký (US-12)'

const unauthorized = unauthorizedResponse('Chưa đăng nhập hoặc access token hết hạn')

registry.registerPath({
  method: 'post',
  path: '/workshop-registrations',
  tags: [TAG],
  summary: 'Đăng ký lớp workshop',
  description: `Đăng ký ở trạng thái \`pending\` (chờ cửa hàng xác nhận) và giữ chỗ ngay.

- \`seats\` mặc định 1, tối đa 10 mỗi lượt và không vượt số chỗ còn lại
- \`totalPrice\` = \`seats\` × học phí lúc đăng ký; email liên hệ lấy từ tài khoản
- Mỗi tài khoản chỉ có một đăng ký chưa huỷ trong một lớp
- Hai người đăng ký cùng lúc được xử lý lần lượt nên lớp không bao giờ bị đặt quá số chỗ`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreateRegistrationBodySchema),
  responses: {
    201: {
      description: 'Đăng ký thành công',
      content: {
        'application/json': {
          schema: successWrapper(
            WorkshopRegistrationSchema,
            '/workshop-registrations',
            201,
            'Đăng ký thành công, vui lòng chờ cửa hàng xác nhận'
          )
        }
      }
    },
    400: badRequestResponse('Lớp đã hết hạn đăng ký / hết chỗ / không đủ chỗ'),
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy lớp workshop'),
    409: conflictResponse('Bạn đã đăng ký lớp này rồi'),
    422: validationErrorResponse()
  }
})

// ─── US-13: Quản lý đăng ký workshop ─────────────────────────────────────────

const MY_TAG = 'Workshop - Lịch của tôi (US-13)'

const registrationResponse = (path: string, message: string) => ({
  description: message,
  content: { 'application/json': { schema: successWrapper(WorkshopRegistrationSchema, path, 200, message) } }
})

registry.registerPath({
  method: 'get',
  path: '/workshop-registrations',
  tags: [MY_TAG],
  summary: 'Lịch workshop của tôi',
  description: `Các đăng ký của tài khoản đang đăng nhập, mới đăng ký lên trước.

- \`status\`: lọc theo trạng thái
- \`workshopId\`: xem mình đã đăng ký một lớp chưa (trang chi tiết lớp)`,
  security: [{ bearerAuth: [] }],
  request: { query: MyRegistrationQuerySchema },
  responses: {
    200: {
      description: 'Danh sách đăng ký',
      content: {
        'application/json': { schema: paginatedWrapper(WorkshopRegistrationSchema, '/workshop-registrations') }
      }
    },
    401: unauthorized,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/workshop-registrations/{id}/cancel',
  tags: [MY_TAG],
  summary: 'Tự huỷ đăng ký',
  description: `Chỉ huỷ được đăng ký của chính mình đang \`pending\` hoặc \`confirmed\`, trước giờ học 24 tiếng (xem \`cancellableUntil\`). Huỷ xong lớp được trả lại chỗ.

Body không bắt buộc; \`reason\` là lý do huỷ.`,
  security: [{ bearerAuth: [] }],
  request: {
    params: RegistrationIdParamSchema,
    body: { required: false, content: { 'application/json': { schema: CancelRegistrationBodySchema } } }
  },
  responses: {
    200: registrationResponse('/workshop-registrations/{id}/cancel', 'Đã huỷ đăng ký'),
    400: badRequestResponse('Đăng ký không còn huỷ được / đã quá hạn tự huỷ'),
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy đăng ký'),
    409: conflictResponse('Trạng thái đăng ký vừa thay đổi'),
    422: validationErrorResponse()
  }
})

const ADMIN_TAG = 'Admin - Đăng ký workshop (US-13)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

registry.registerPath({
  method: 'get',
  path: '/admin/workshop-registrations',
  tags: [ADMIN_TAG],
  summary: 'Danh sách đăng ký workshop',
  description: `Mới đăng ký lên trước. Phân trang bằng \`limit\`/\`offset\`.

- \`search\`: mã đăng ký, tên, số điện thoại hoặc email người liên hệ
- \`workshopId\`: đăng ký của một lớp
- \`status\`: \`pending\`, \`confirmed\`, \`attended\`, \`cancelled\``,
  security: [{ bearerAuth: [] }],
  request: { query: AdminRegistrationQuerySchema },
  responses: {
    200: {
      description: 'Danh sách đăng ký',
      content: {
        'application/json': { schema: paginatedWrapper(WorkshopRegistrationSchema, '/admin/workshop-registrations') }
      }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/workshop-registrations/{id}/status',
  tags: [ADMIN_TAG],
  summary: 'Xác nhận / check-in / huỷ đăng ký',
  description: `- \`confirmed\`: từ \`pending\`
- \`attended\` (check-in): từ \`pending\` hoặc \`confirmed\`, từ 60 phút trước giờ học
- \`cancelled\`: từ \`pending\` hoặc \`confirmed\`, kèm \`cancelReason\` (khách sẽ thấy); lớp được trả lại chỗ

Đăng ký đã huỷ hoặc đã tham gia không đổi được nữa.`,
  security: [{ bearerAuth: [] }],
  request: { params: RegistrationIdParamSchema, ...jsonBody(UpdateRegistrationStatusBodySchema) },
  responses: {
    200: registrationResponse('/admin/workshop-registrations/{id}/status', 'Đã xác nhận đăng ký'),
    400: badRequestResponse('Không đổi được trạng thái / chưa tới giờ check-in'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy đăng ký'),
    409: conflictResponse('Trạng thái đăng ký vừa thay đổi'),
    422: validationErrorResponse()
  }
})
