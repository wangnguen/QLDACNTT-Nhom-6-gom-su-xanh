import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

export const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Access token — Authorization: Bearer <token>'
})

registry.registerComponent('securitySchemes', 'refreshTokenAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'rt',
  description: 'Refresh token của trang client, lưu trong httpOnly cookie `rt` — trình duyệt tự gửi sau khi đăng nhập.'
})

registry.registerComponent('securitySchemes', 'adminRefreshTokenAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'rt_admin',
  description: 'Refresh token của trang admin, lưu trong httpOnly cookie `rt_admin`.'
})
