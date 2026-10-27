import { instanceToPlain } from 'class-transformer'

import { logger } from '@common/config'
import {
  AUTH_TOKEN,
  AuthTokenType,
  OTP_EXPIRE_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS
} from '@common/constants'
import { BadRequestError, ConflictError } from '@common/errors'
import { EmailService } from '@common/services'
import { AuthUser } from '@common/types'
import { hashPassword } from '@common/utils/password'
import { generateRandomDigits, hashAuthToken, safeEqual } from '@common/utils/random'

import { AuthToken } from '@entities/auth-token.entity'

import AuthRepository, { OtpData } from './auth.repository'
import { RegisterBody, ResendVerificationBody, VerifyEmailBody } from './dto'

const INVALID_OTP_MESSAGE = 'Mã OTP không đúng hoặc đã hết hạn'

class AuthService {
  private static emailService = new EmailService()

  // US-01: Đăng ký tài khoản → gửi OTP xác thực email
  static async register(dto: RegisterBody): Promise<AuthUser> {
    const [userWithEmail, userWithPhone] = await Promise.all([
      AuthRepository.findByEmail(dto.email),
      AuthRepository.findByPhone(dto.phone)
    ])

    if (userWithEmail?.isEmailVerified) throw new ConflictError('Email này đã được đăng ký')

    const phoneOwner = userWithPhone && userWithPhone.id !== userWithEmail?.id ? userWithPhone : null
    if (phoneOwner?.isEmailVerified) throw new ConflictError('Số điện thoại này đã được đăng ký')

    const otp = generateRandomDigits(OTP_LENGTH)
    const user = await AuthRepository.saveUnverifiedUserWithOtp(
      {
        id: userWithEmail?.id,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: await hashPassword(dto.password)
      },
      AuthService.buildOtpData(otp, AUTH_TOKEN.VERIFY_EMAIL),
      phoneOwner?.id
    )

    await AuthService.emailService.sendVerifyEmailOtp(user.email, otp, user.fullName)

    return instanceToPlain(user) as AuthUser
  }

  static async verifyEmail({ email, otp }: VerifyEmailBody): Promise<void> {
    const user = await AuthRepository.findByEmail(email)
    if (user?.isEmailVerified) throw new BadRequestError('Email đã được xác thực, bạn có thể đăng nhập')
    if (!user) throw new BadRequestError(INVALID_OTP_MESSAGE)

    const authToken = await AuthService.verifyOtp(user.id, AUTH_TOKEN.VERIFY_EMAIL, otp)
    await AuthRepository.markEmailVerified(user.id, authToken.id)
  }

  // Luôn trả về thành công để không lộ email nào đã đăng ký
  static async resendVerification({ email }: ResendVerificationBody): Promise<void> {
    const user = await AuthRepository.findByEmail(email)
    if (!user || user.isEmailVerified) return

    const otp = await AuthService.issueOtp(user.id, AUTH_TOKEN.VERIFY_EMAIL)
    if (otp) {
      AuthService.sendInBackground(AuthService.emailService.sendVerifyEmailOtp(user.email, otp, user.fullName))
    }
  }

  // Tạo OTP mới (thay mã cũ). Trả về null nếu vừa gửi trong khoảng OTP_RESEND_COOLDOWN_SECONDS.
  private static async issueOtp(userId: string, type: AuthTokenType): Promise<string | null> {
    const latest = await AuthRepository.findLatestAuthToken(userId, type)
    if (latest && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) return null

    const otp = generateRandomDigits(OTP_LENGTH)
    await AuthRepository.replaceAuthToken(userId, AuthService.buildOtpData(otp, type))
    return otp
  }

  private static async verifyOtp(userId: string, type: AuthTokenType, otp: string): Promise<AuthToken> {
    const authToken = await AuthRepository.findActiveAuthToken(userId, type)
    if (!authToken) throw new BadRequestError(INVALID_OTP_MESSAGE)

    if (authToken.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestError('Bạn đã nhập sai quá nhiều lần, vui lòng yêu cầu mã OTP mới')
    }

    if (!safeEqual(authToken.token, hashAuthToken(otp))) {
      await AuthRepository.incrementAuthTokenAttempts(authToken.id)
      throw new BadRequestError(INVALID_OTP_MESSAGE)
    }

    return authToken
  }

  private static buildOtpData(otp: string, type: AuthTokenType): OtpData {
    return {
      tokenHash: hashAuthToken(otp),
      type,
      expiresAt: new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000)
    }
  }

  // Gửi mail không chờ kết quả: response trả về ngay, thời gian phản hồi không để lộ email có tồn tại hay không
  private static sendInBackground(sending: Promise<void>) {
    sending.catch((err) => logger.error(err, 'Failed to send email'))
  }
}

export default AuthService
