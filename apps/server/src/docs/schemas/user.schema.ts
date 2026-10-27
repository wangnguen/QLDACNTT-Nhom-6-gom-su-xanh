import { registry } from '@docs/registry'

import { UpdateProfileBodySchema } from '@modules/user/dto'

import {
  AuthUserSchema,
  conflictResponse,
  jsonBody,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

registry.registerPath({
  method: 'get',
  path: '/users/me',
  tags: ['User'],
  summary: 'Lấy thông tin người dùng đang đăng nhập',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Thông tin người dùng',
      content: {
        'application/json': {
          schema: successWrapper(AuthUserSchema, '/users/me')
        }
      }
    },
    401: unauthorizedResponse('Thiếu hoặc sai access token')
  }
})

// ─── US-06: Quản lý thông tin cá nhân ────────────────────────────────────────

registry.registerPath({
  method: 'patch',
  path: '/users/me',
  tags: ['Tài khoản - Thông tin cá nhân (US-06)'],
  summary: 'Cập nhật thông tin cá nhân',
  description: `Chỉ cập nhật các trường được gửi lên. \`gender\`/\`address\` gửi \`null\` (hoặc address rỗng) để xoá.

Email không đổi được ở đây — dùng \`POST /auth/change-email\`.`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(UpdateProfileBodySchema),
  responses: {
    200: {
      description: 'Cập nhật thành công, trả về thông tin người dùng mới',
      content: {
        'application/json': {
          schema: successWrapper(AuthUserSchema, '/users/me', 200, 'Cập nhật thông tin thành công')
        }
      }
    },
    401: unauthorizedResponse('Thiếu hoặc sai access token'),
    409: conflictResponse('Số điện thoại này đã được sử dụng bởi tài khoản khác'),
    422: validationErrorResponse()
  }
})
