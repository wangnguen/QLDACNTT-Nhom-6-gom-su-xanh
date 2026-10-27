import { Router } from 'express'

import { authRateLimiterMiddleware, validateBody } from '@common/middlewares'

import AuthController from './auth.controller'
import { RegisterBodySchema, ResendVerificationBodySchema, VerifyEmailBodySchema } from './dto'

const router = Router()

// US-01: Đăng ký tài khoản
router.post('/register', authRateLimiterMiddleware, validateBody(RegisterBodySchema), AuthController.register)
router.post('/verify-email', authRateLimiterMiddleware, validateBody(VerifyEmailBodySchema), AuthController.verifyEmail)
router.post(
  '/resend-verification',
  authRateLimiterMiddleware,
  validateBody(ResendVerificationBodySchema),
  AuthController.resendVerification
)

export default router
