import { Request, Response } from 'express'

import { env } from '@common/config'
import { AUTH_SCOPE, AuthScope, REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '@common/constants'

import AuthService from './auth.service'
import {
  ChangeEmailBody,
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResendVerificationBody,
  ResetPasswordBody,
  VerifyChangeEmailBody,
  VerifyEmailBody
} from './dto'

class AuthController {
  static async register(req: Request, res: Response) {
    const user = await AuthService.register(req.body as RegisterBody)

    return res.created({ user }, { message: 'Đăng ký thành công. Mã xác thực đã được gửi tới email của bạn' })
  }

  static async verifyEmail(req: Request, res: Response) {
    await AuthService.verifyEmail(req.body as VerifyEmailBody)

    return res.ok(null, { message: 'Xác thực email thành công. Bạn có thể đăng nhập ngay' })
  }

  static async resendVerification(req: Request, res: Response) {
    await AuthService.resendVerification(req.body as ResendVerificationBody)

    return res.ok(null, { message: 'Nếu email chưa được xác thực, mã OTP mới đã được gửi' })
  }

  // login / refreshToken / logout dùng chung cho client và admin, khác nhau ở `scope` (cookie + quyền)
  static login(scope: AuthScope) {
    return async (req: Request, res: Response) => {
      const { accessToken, refreshToken, user } = await AuthService.login(req.body as LoginBody, scope)

      AuthController.setRefreshTokenCookie(res, scope, refreshToken)

      return res.ok({ accessToken, user }, { message: 'Đăng nhập thành công' })
    }
  }

  static refreshToken(scope: AuthScope) {
    return async (req: Request, res: Response) => {
      const { accessToken, refreshToken } = await AuthService.refreshToken(
        req.cookies[scope.cookieName],
        req.refreshUserId as string,
        scope
      )

      AuthController.setRefreshTokenCookie(res, scope, refreshToken)

      return res.ok({ accessToken }, { message: 'Làm mới phiên đăng nhập thành công' })
    }
  }

  static logout(scope: AuthScope) {
    return async (req: Request, res: Response) => {
      await AuthService.logout(req.cookies[scope.cookieName])
      res.clearCookie(scope.cookieName, { path: scope.cookiePath })

      return res.ok(null, { message: 'Đăng xuất thành công' })
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    await AuthService.forgotPassword(req.body as ForgotPasswordBody)

    return res.ok(null, { message: 'Nếu email tồn tại trong hệ thống, mã OTP đặt lại mật khẩu đã được gửi' })
  }

  static async resetPassword(req: Request, res: Response) {
    await AuthService.resetPassword(req.body as ResetPasswordBody)

    return res.ok(null, { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại' })
  }

  static async requestChangeEmail(req: Request, res: Response) {
    await AuthService.requestChangeEmail(req.user!.id, req.body as ChangeEmailBody)

    return res.ok(null, { message: 'Mã xác nhận đã được gửi tới email mới' })
  }

  static async verifyChangeEmail(req: Request, res: Response) {
    const user = await AuthService.verifyChangeEmail(req.user!.id, req.body as VerifyChangeEmailBody)

    return res.ok(user, { message: 'Đổi email thành công' })
  }

  // Đổi mật khẩu chỉ có ở trang client → thay cookie `rt` bằng refresh token mới (các token cũ đã bị thu hồi)
  static async changePassword(req: Request, res: Response) {
    const { accessToken, refreshToken } = await AuthService.changePassword(req.user!.id, req.body as ChangePasswordBody)

    AuthController.setRefreshTokenCookie(res, AUTH_SCOPE.CLIENT, refreshToken)

    return res.ok({ accessToken }, { message: 'Đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất' })
  }

  private static setRefreshTokenCookie(res: Response, scope: AuthScope, refreshToken: string) {
    res.cookie(scope.cookieName, refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: scope.cookiePath,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS
    })
  }
}

export default AuthController
