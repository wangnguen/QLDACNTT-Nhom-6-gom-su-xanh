import { Request, Response } from 'express'

import AuthService from './auth.service'
import { RegisterBody, ResendVerificationBody, VerifyEmailBody } from './dto'

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
}

export default AuthController
