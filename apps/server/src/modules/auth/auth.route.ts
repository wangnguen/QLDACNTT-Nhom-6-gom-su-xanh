import { Router } from 'express'

import { AUTH_SCOPE } from '@common/constants'
import { AuthMiddleware, authRateLimiterMiddleware, validateBody } from '@common/middlewares'

import AuthController from './auth.controller'
import {
  ChangeEmailBodySchema,
  ForgotPasswordBodySchema,
  LoginBodySchema,
  RegisterBodySchema,
  ResendVerificationBodySchema,
  ResetPasswordBodySchema,
  VerifyChangeEmailBodySchema,
  VerifyEmailBodySchema
} from './dto'

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

// US-02: Đăng nhập hệ thống — trang client
router.post('/login', authRateLimiterMiddleware, validateBody(LoginBodySchema), AuthController.login(AUTH_SCOPE.CLIENT))
router.post(
  '/refresh-token',
  AuthMiddleware.authenticateRefreshToken(AUTH_SCOPE.CLIENT),
  AuthController.refreshToken(AUTH_SCOPE.CLIENT)
)
router.post('/logout', AuthController.logout(AUTH_SCOPE.CLIENT))

// US-02: Đăng nhập hệ thống — trang admin (chỉ tài khoản role admin)
router.post(
  '/admin/login',
  authRateLimiterMiddleware,
  validateBody(LoginBodySchema),
  AuthController.login(AUTH_SCOPE.ADMIN)
)
router.post(
  '/admin/refresh-token',
  AuthMiddleware.authenticateRefreshToken(AUTH_SCOPE.ADMIN),
  AuthController.refreshToken(AUTH_SCOPE.ADMIN)
)
router.post('/admin/logout', AuthController.logout(AUTH_SCOPE.ADMIN))

// US-03: Quên mật khẩu
router.post(
  '/forgot-password',
  authRateLimiterMiddleware,
  validateBody(ForgotPasswordBodySchema),
  AuthController.forgotPassword
)
router.post(
  '/reset-password',
  authRateLimiterMiddleware,
  validateBody(ResetPasswordBodySchema),
  AuthController.resetPassword
)

// US-04: Thay đổi email (đã đăng nhập) — gửi OTP tới email mới, rồi xác nhận bằng OTP
router.post(
  '/change-email',
  authRateLimiterMiddleware,
  AuthMiddleware.authenticate,
  validateBody(ChangeEmailBodySchema),
  AuthController.requestChangeEmail
)
router.post(
  '/change-email/verify',
  authRateLimiterMiddleware,
  AuthMiddleware.authenticate,
  validateBody(VerifyChangeEmailBodySchema),
  AuthController.verifyChangeEmail
)

export default router
