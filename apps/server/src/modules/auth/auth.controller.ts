import { Request, Response } from 'express'

import { env } from '@common/config'
import { AuthScope, REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '@common/constants'

import AuthService from './auth.service'
import {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResendVerificationBody,
  ResetPasswordBody,
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
