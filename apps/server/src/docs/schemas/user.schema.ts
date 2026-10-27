import { registry } from '@docs/registry'

import { AuthUserSchema, successWrapper, unauthorizedResponse } from './shared'

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
