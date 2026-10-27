import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { RegisterBodySchema, ResendVerificationBodySchema, VerifyEmailBodySchema } from '@modules/auth/dto'

import {
  AuthUserSchema,
  badRequestResponse,
  conflictResponse,
  jsonBody,
  nullSuccessResponse,
  rateLimitResponse,
  successWrapper,
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
