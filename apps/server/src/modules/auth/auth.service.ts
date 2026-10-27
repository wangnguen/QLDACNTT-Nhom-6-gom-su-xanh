import { instanceToPlain } from 'class-transformer'

import { env, logger } from '@common/config'
import {
  AUTH_TOKEN,
  AuthScope,
  AuthTokenType,
  OTP_EXPIRE_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  USER_ROLE
} from '@common/constants'
import { BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from '@common/errors'
import { EmailService, JWTService } from '@common/services'
import { AuthResponse, AuthTokens, AuthUser } from '@common/types'
import { comparePassword, hashPassword } from '@common/utils/password'
import { generateRandomDigits, hashAuthToken, safeEqual } from '@common/utils/random'

import { AuthToken } from '@entities/auth-token.entity'
import { User } from '@entities/user.entity'

import AuthRepository, { OtpData } from './auth.repository'
import {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResendVerificationBody,
  ResetPasswordBody,
  VerifyEmailBody
} from './dto'

const INVALID_OTP_MESSAGE = 'Mã OTP không đúng hoặc đã hết hạn'
const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
const ADMIN_ONLY_MESSAGE = 'Tài khoản không có quyền truy cập trang quản trị'

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

  // US-02: Đăng nhập bằng email hoặc số điện thoại
  static async login(dto: LoginBody, scope: AuthScope): Promise<AuthResponse> {
    const user = await AuthRepository.findByEmailOrPhoneWithPassword(dto.identifier)
    const isPasswordValid = !!user?.password && (await comparePassword(dto.password, user.password))
    if (!user || !isPasswordValid) {
      throw new UnauthorizedError('Email/số điện thoại hoặc mật khẩu không đúng')
    }

    if (scope.adminOnly && user.role !== USER_ROLE.ADMIN) throw new ForbiddenError(ADMIN_ONLY_MESSAGE)

    if (!user.isEmailVerified) {
      throw new ForbiddenError('Tài khoản chưa xác thực email. Vui lòng xác thực email trước khi đăng nhập')
    }

    const tokens = await AuthService.generateTokens(user)
    return { ...tokens, user: instanceToPlain(user) as AuthUser }
  }

  static async refreshToken(currentRefreshToken: string, userId: string, scope: AuthScope): Promise<AuthTokens> {
    const storedToken = await AuthRepository.findRefreshToken(JWTService.hashRefreshToken(currentRefreshToken))
    if (!storedToken || storedToken.userId !== userId || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError(SESSION_EXPIRED_MESSAGE)
    }

    if (storedToken.absoluteExpiresAt < new Date()) {
      throw new UnauthorizedError(SESSION_EXPIRED_MESSAGE)
    }

    await AuthRepository.deleteRefreshTokenById(storedToken.id)

    const user = await AuthRepository.findById(userId)
    if (!user) throw new UnauthorizedError(SESSION_EXPIRED_MESSAGE)
    if (scope.adminOnly && user.role !== USER_ROLE.ADMIN) throw new ForbiddenError(ADMIN_ONLY_MESSAGE)

    const accessToken = JWTService.generateAccessToken({ sub: user.id, email: user.email, role: user.role })
    const refreshToken = JWTService.generateRefreshToken({ sub: user.id })

    await AuthRepository.saveRefreshToken({
      tokenHash: JWTService.hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000),
      absoluteExpiresAt: storedToken.absoluteExpiresAt
    })

    return { accessToken, refreshToken }
  }

  static async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return
    await AuthRepository.deleteRefreshToken(JWTService.hashRefreshToken(refreshToken))
  }

  // US-03: Quên mật khẩu → gửi OTP; luôn trả về thành công để không lộ email nào đã đăng ký
  static async forgotPassword({ email }: ForgotPasswordBody): Promise<void> {
    const user = await AuthRepository.findByEmail(email)
    if (!user?.isEmailVerified) return

    const otp = await AuthService.issueOtp(user.id, AUTH_TOKEN.RESET_PASSWORD)
    if (otp) {
      AuthService.sendInBackground(AuthService.emailService.sendResetPasswordOtp(user.email, otp, user.fullName))
    }
  }

  static async resetPassword({ email, otp, password }: ResetPasswordBody): Promise<void> {
    const user = await AuthRepository.findByEmail(email)
    if (!user?.isEmailVerified) throw new BadRequestError(INVALID_OTP_MESSAGE)

    const authToken = await AuthService.verifyOtp(user.id, AUTH_TOKEN.RESET_PASSWORD, otp)
    await AuthRepository.resetPassword(user.id, authToken.id, await hashPassword(password))
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

  private static async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = JWTService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    })

    const refreshToken = JWTService.generateRefreshToken({
      sub: user.id
    })

    await Promise.all([
      AuthRepository.saveRefreshToken({
        tokenHash: JWTService.hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000),
        absoluteExpiresAt: new Date(Date.now() + env.MAX_SESSION_LIFETIME_IN * 1000)
      }),
      AuthRepository.updateLastLogin(user.id)
    ])
    return { accessToken, refreshToken }
  }
}

export default AuthService
