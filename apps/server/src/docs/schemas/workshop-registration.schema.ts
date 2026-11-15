import { registry } from '@docs/registry'

import { CreateRegistrationBodySchema } from '@modules/workshop-registration/dto'

import {
  WorkshopRegistrationSchema,
  badRequestResponse,
  conflictResponse,
  jsonBody,
  notFoundResponse,
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
