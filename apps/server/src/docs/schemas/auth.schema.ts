import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import {
  ForgotPasswordBodySchema,
  LoginBodyExample,
  LoginBodyPhoneExample,
  LoginBodySchema,
  RegisterBodySchema,
  ResendVerificationBodySchema,
  ResetPasswordBodySchema,
  VerifyEmailBodySchema
} from '@modules/auth/dto'

import {
  AuthResponseSchema,
  AuthUserSchema,
  TokenPairSchema,
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  jsonBody,
  nullSuccessResponse,
  rateLimitResponse,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-01: Đăng ký tài khoản ────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth - Đăng ký (US-01)'],
  summary: 'Đăng ký tài khoản',
  description: `Tạo tài khoản ở trạng thái **chưa xác thực** và gửi mã OTP 6 số tới email.

Nếu email đã đăng ký nhưng chưa xác thực, thông tin được ghi đè và gửi mã OTP mới.

Ở môi trường dev chưa cấu hình SMTP, mã OTP được in ra console của server.`,
  request: jsonBody(RegisterBodySchema),
  responses: {
    201: {
      description: 'Đăng ký thành công, chờ xác thực email',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({ user: AuthUserSchema }),
            '/auth/register',
            201,
            'Đăng ký thành công. Mã xác thực đã được gửi tới email của bạn'
          )
        }
      }
    },
    409: conflictResponse('Email này đã được đăng ký'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/verify-email',
  tags: ['Auth - Đăng ký (US-01)'],
  summary: 'Xác thực email bằng mã OTP',
  description: 'Mã OTP có hiệu lực 10 phút, nhập sai quá 5 lần thì phải yêu cầu mã mới.',
  request: jsonBody(VerifyEmailBodySchema),
  responses: {
    200: nullSuccessResponse('/auth/verify-email', 'Xác thực email thành công. Bạn có thể đăng nhập ngay'),
    400: badRequestResponse('Mã OTP không đúng hoặc đã hết hạn'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/resend-verification',
  tags: ['Auth - Đăng ký (US-01)'],
  summary: 'Gửi lại mã OTP xác thực email',
  description: 'Luôn trả về thành công (không lộ email đã đăng ký hay chưa). Mỗi email chỉ được gửi lại sau 60 giây.',
  request: jsonBody(ResendVerificationBodySchema),
  responses: {
    200: nullSuccessResponse('/auth/resend-verification', 'Nếu email chưa được xác thực, mã OTP mới đã được gửi'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

// ─── US-02: Đăng nhập hệ thống ───────────────────────────────────────────────

const loginExamples = {
  email: { summary: 'Đăng nhập bằng email', value: LoginBodyExample },
  phone: { summary: 'Đăng nhập bằng số điện thoại', value: LoginBodyPhoneExample }
}

const loginResponses = (path: string) => ({
  200: {
    description: 'Đăng nhập thành công. Refresh token được set vào httpOnly cookie.',
    content: {
      'application/json': {
        schema: successWrapper(AuthResponseSchema, path, 200, 'Đăng nhập thành công')
      }
    }
  },
  401: unauthorizedResponse('Email/số điện thoại hoặc mật khẩu không đúng'),
  422: validationErrorResponse(),
  429: rateLimitResponse()
})

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth - Đăng nhập (US-02)'],
  summary: 'Đăng nhập trang client',
  description: 'Đăng nhập bằng email hoặc số điện thoại. Refresh token lưu trong cookie `rt`.',
  request: jsonBody(LoginBodySchema, loginExamples),
  responses: {
    ...loginResponses('/auth/login'),
    403: forbiddenResponse('Tài khoản chưa xác thực email')
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/refresh-token',
  tags: ['Auth - Đăng nhập (US-02)'],
  summary: 'Cấp access token mới (client)',
  description: 'Đọc refresh token từ cookie `rt`, trả access token mới và xoay vòng (rotate) refresh token.',
  security: [{ refreshTokenAuth: [] }],
  responses: {
    200: {
      description: 'Access token mới',
      content: {
        'application/json': {
          schema: successWrapper(TokenPairSchema, '/auth/refresh-token', 200, 'Làm mới phiên đăng nhập thành công')
        }
      }
    },
    401: unauthorizedResponse('Phiên đăng nhập đã hết hạn')
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth - Đăng nhập (US-02)'],
  summary: 'Đăng xuất (client)',
  security: [{ refreshTokenAuth: [] }],
  responses: {
    200: nullSuccessResponse('/auth/logout', 'Đăng xuất thành công')
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/admin/login',
  tags: ['Auth - Đăng nhập (US-02)'],
  summary: 'Đăng nhập trang admin',
  description:
    'Chỉ tài khoản role `admin`. Refresh token lưu trong cookie `rt_admin`, tách biệt với phiên của trang client.',
  request: jsonBody(LoginBodySchema, loginExamples),
  responses: {
    ...loginResponses('/auth/admin/login'),
    403: forbiddenResponse('Tài khoản không có quyền truy cập trang quản trị')
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/admin/refresh-token',
  tags: ['Auth - Đăng nhập (US-02)'],
  summary: 'Cấp access token mới (admin)',
  security: [{ adminRefreshTokenAuth: [] }],
  responses: {
    200: {
      description: 'Access token mới',
      content: {
        'application/json': {
          schema: successWrapper(
            TokenPairSchema,
            '/auth/admin/refresh-token',
            200,
            'Làm mới phiên đăng nhập thành công'
          )
        }
      }
    },
    401: unauthorizedResponse('Phiên đăng nhập đã hết hạn'),
    403: forbiddenResponse('Tài khoản không có quyền truy cập trang quản trị')
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/admin/logout',
  tags: ['Auth - Đăng nhập (US-02)'],
  summary: 'Đăng xuất (admin)',
  security: [{ adminRefreshTokenAuth: [] }],
  responses: {
    200: nullSuccessResponse('/auth/admin/logout', 'Đăng xuất thành công')
  }
})

// ─── US-03: Quên mật khẩu ────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Auth - Quên mật khẩu (US-03)'],
  summary: 'Gửi mã OTP đặt lại mật khẩu',
  description: 'Luôn trả về thành công (không lộ email đã đăng ký hay chưa). Mỗi email chỉ được gửi lại sau 60 giây.',
  request: jsonBody(ForgotPasswordBodySchema),
  responses: {
    200: nullSuccessResponse(
      '/auth/forgot-password',
      'Nếu email tồn tại trong hệ thống, mã OTP đặt lại mật khẩu đã được gửi'
    ),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: ['Auth - Quên mật khẩu (US-03)'],
  summary: 'Đặt lại mật khẩu bằng mã OTP',
  description: 'Đặt mật khẩu mới và đăng xuất mọi phiên đăng nhập đang mở của tài khoản.',
  request: jsonBody(ResetPasswordBodySchema),
  responses: {
    200: nullSuccessResponse('/auth/reset-password', 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại'),
    400: badRequestResponse('Mã OTP không đúng hoặc đã hết hạn'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})
