import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@common/config'
import { AUTH_SCOPE, AUTH_TOKEN, OTP_MAX_ATTEMPTS, USER_ROLE } from '@common/constants'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError
} from '@common/errors'
import { JWTService } from '@common/services'
import { hashAuthToken } from '@common/utils/random'

import AuthRepository from '@modules/auth/auth.repository'
import AuthService from '@modules/auth/auth.service'

import { fakeHash, makeAuthToken, makeRefreshToken, makeUser, PASSWORD } from '../../helpers/factories'

const emailService = vi.hoisted(() => ({
  sendVerifyEmailOtp: vi.fn(async () => {}),
  sendResetPasswordOtp: vi.fn(async () => {}),
  sendChangeEmailOtp: vi.fn(async () => {}),
  sendEmailChangedNotice: vi.fn(async () => {}),
  sendPasswordChangedNotice: vi.fn(async () => {})
}))

vi.mock('@common/services/email.service', () => ({
  default: function MockEmailService() {
    return emailService
  }
}))

vi.mock('@common/utils/password', () => ({
  hashPassword: vi.fn(async (plain: string) => `hashed:${plain}`),
  comparePassword: vi.fn(async (plain: string, hashed: string) => hashed === `hashed:${plain}`)
}))

// Repository giả: không cần kết nối DB
vi.mock('@modules/auth/auth.repository', () => ({
  default: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByPhone: vi.fn(),
    findByEmailOrPhoneWithPassword: vi.fn(),
    findByIdWithPassword: vi.fn(),
    saveUnverifiedUserWithOtp: vi.fn(),
    replaceAuthToken: vi.fn(),
    findLatestAuthToken: vi.fn(),
    findActiveAuthToken: vi.fn(),
    incrementAuthTokenAttempts: vi.fn(),
    markEmailVerified: vi.fn(),
    resetPassword: vi.fn(),
    changeEmail: vi.fn(),
    changePassword: vi.fn(),
    updateLastLogin: vi.fn(),
    saveRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    deleteRefreshTokenById: vi.fn()
  }
}))

const repo = vi.mocked(AuthRepository)

const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000)

// Mã OTP thật mà service gửi trong mail — dùng để đối chiếu với HMAC đã lưu
const sentOtp = (mock: { mock: { lastCall?: unknown[] } }) => mock.mock.lastCall?.[1] as string

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AuthService.register', () => {
  const dto = {
    fullName: 'Trần Thị Bình',
    email: 'binh.tran@yahoo.com',
    phone: '0987654321',
    password: PASSWORD,
    confirmPassword: PASSWORD
  }

  it('tạo user chưa xác thực và gửi OTP tới đúng email vừa đăng ký', async () => {
    const savedUser = makeUser({ id: 'user-2', ...dto, isEmailVerified: false })
    repo.saveUnverifiedUserWithOtp.mockResolvedValue(savedUser)

    const result = await AuthService.register(dto)

    expect(repo.saveUnverifiedUserWithOtp).toHaveBeenCalledWith(
      { id: undefined, fullName: dto.fullName, email: dto.email, phone: dto.phone, password: fakeHash(PASSWORD) },
      expect.objectContaining({ type: AUTH_TOKEN.VERIFY_EMAIL, tokenHash: expect.any(String) }),
      undefined
    )
    expect(emailService.sendVerifyEmailOtp).toHaveBeenCalledWith(
      'binh.tran@yahoo.com',
      expect.any(String),
      dto.fullName
    )
    expect(result).toMatchObject({ id: 'user-2', email: 'binh.tran@yahoo.com', isEmailVerified: false })
  })

  it('chỉ lưu HMAC của OTP, mã gốc chỉ nằm trong mail', async () => {
    repo.saveUnverifiedUserWithOtp.mockResolvedValue(makeUser({ isEmailVerified: false }))

    await AuthService.register(dto)

    const otp = sentOtp(emailService.sendVerifyEmailOtp)
    const otpData = repo.saveUnverifiedUserWithOtp.mock.lastCall?.[1]
    expect(otp).toMatch(/^\d{6}$/)
    expect(otpData?.tokenHash).toBe(hashAuthToken(otp))
    expect(otpData?.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('báo trùng khi email đã được đăng ký và xác thực', async () => {
    repo.findByEmail.mockResolvedValue(makeUser({ email: dto.email }))

    await expect(AuthService.register(dto)).rejects.toThrow(ConflictError)
    expect(repo.saveUnverifiedUserWithOtp).not.toHaveBeenCalled()
    expect(emailService.sendVerifyEmailOtp).not.toHaveBeenCalled()
  })

  it('báo trùng khi số điện thoại thuộc tài khoản khác đã xác thực', async () => {
    repo.findByPhone.mockResolvedValue(makeUser({ id: 'other', phone: dto.phone }))

    await expect(AuthService.register(dto)).rejects.toThrow('Số điện thoại này đã được đăng ký')
  })

  it('đăng ký lại email chưa xác thực: ghi đè user cũ và xoá tài khoản dở dang đang giữ số điện thoại', async () => {
    repo.findByEmail.mockResolvedValue(makeUser({ id: 'pending-email', isEmailVerified: false }))
    repo.findByPhone.mockResolvedValue(makeUser({ id: 'pending-phone', isEmailVerified: false }))
    repo.saveUnverifiedUserWithOtp.mockResolvedValue(makeUser({ id: 'pending-email', isEmailVerified: false }))

    await AuthService.register(dto)

    expect(repo.saveUnverifiedUserWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pending-email' }),
      expect.anything(),
      'pending-phone'
    )
  })

  it('báo lỗi cho người dùng khi gửi mail thất bại (không âm thầm bỏ qua)', async () => {
    repo.saveUnverifiedUserWithOtp.mockResolvedValue(makeUser({ isEmailVerified: false }))
    emailService.sendVerifyEmailOtp.mockRejectedValue(new Error('SMTP down'))

    await expect(AuthService.register(dto)).rejects.toThrow('SMTP down')
  })
})

describe('AuthService.verifyEmail', () => {
  const unverifiedUser = makeUser({ isEmailVerified: false })

  it('đánh dấu email đã xác thực khi nhập đúng OTP', async () => {
    repo.findByEmail.mockResolvedValue(unverifiedUser)
    repo.findActiveAuthToken.mockResolvedValue(makeAuthToken('123456'))

    await AuthService.verifyEmail({ email: unverifiedUser.email, otp: '123456' })

    expect(repo.findActiveAuthToken).toHaveBeenCalledWith(unverifiedUser.id, AUTH_TOKEN.VERIFY_EMAIL)
    expect(repo.markEmailVerified).toHaveBeenCalledWith(unverifiedUser.id, 'auth-token-1')
  })

  it('sai OTP: báo lỗi và tăng số lần nhập sai', async () => {
    repo.findByEmail.mockResolvedValue(unverifiedUser)
    repo.findActiveAuthToken.mockResolvedValue(makeAuthToken('123456'))

    await expect(AuthService.verifyEmail({ email: unverifiedUser.email, otp: '000000' })).rejects.toThrow(
      BadRequestError
    )
    expect(repo.incrementAuthTokenAttempts).toHaveBeenCalledWith('auth-token-1')
    expect(repo.markEmailVerified).not.toHaveBeenCalled()
  })

  it(`khoá mã sau ${OTP_MAX_ATTEMPTS} lần nhập sai, kể cả khi lần sau nhập đúng`, async () => {
    repo.findByEmail.mockResolvedValue(unverifiedUser)
    repo.findActiveAuthToken.mockResolvedValue(makeAuthToken('123456', { attempts: OTP_MAX_ATTEMPTS }))

    await expect(AuthService.verifyEmail({ email: unverifiedUser.email, otp: '123456' })).rejects.toThrow(
      'Bạn đã nhập sai quá nhiều lần'
    )
    expect(repo.markEmailVerified).not.toHaveBeenCalled()
  })

  it('báo lỗi khi không còn mã hợp lệ (hết hạn hoặc đã dùng)', async () => {
    repo.findByEmail.mockResolvedValue(unverifiedUser)
    repo.findActiveAuthToken.mockResolvedValue(null)

    await expect(AuthService.verifyEmail({ email: unverifiedUser.email, otp: '123456' })).rejects.toThrow(
      'Mã OTP không đúng hoặc đã hết hạn'
    )
  })

  it('báo lỗi khi email đã xác thực rồi', async () => {
    repo.findByEmail.mockResolvedValue(makeUser())

    await expect(AuthService.verifyEmail({ email: 'an.nguyen@gmail.com', otp: '123456' })).rejects.toThrow(
      'Email đã được xác thực'
    )
  })

  it('email không tồn tại: báo lỗi chung như sai OTP', async () => {
    repo.findByEmail.mockResolvedValue(null)

    await expect(AuthService.verifyEmail({ email: 'khong.ton.tai@gmail.com', otp: '123456' })).rejects.toThrow(
      'Mã OTP không đúng hoặc đã hết hạn'
    )
  })
})

describe('AuthService.resendVerification', () => {
  const unverifiedUser = makeUser({ isEmailVerified: false })

  it('gửi lại OTP mới cho tài khoản chưa xác thực', async () => {
    repo.findByEmail.mockResolvedValue(unverifiedUser)
    repo.findLatestAuthToken.mockResolvedValue(makeAuthToken('111111', { createdAt: secondsAgo(61) }))

    await AuthService.resendVerification({ email: unverifiedUser.email })

    const otp = sentOtp(emailService.sendVerifyEmailOtp)
    expect(emailService.sendVerifyEmailOtp).toHaveBeenCalledWith(unverifiedUser.email, otp, unverifiedUser.fullName)
    expect(repo.replaceAuthToken).toHaveBeenCalledWith(
      unverifiedUser.id,
      expect.objectContaining({ type: AUTH_TOKEN.VERIFY_EMAIL, tokenHash: hashAuthToken(otp) })
    )
  })

  it('không gửi khi vừa gửi trong vòng 60 giây', async () => {
    repo.findByEmail.mockResolvedValue(unverifiedUser)
    repo.findLatestAuthToken.mockResolvedValue(makeAuthToken('111111', { createdAt: secondsAgo(10) }))

    await AuthService.resendVerification({ email: unverifiedUser.email })

    expect(repo.replaceAuthToken).not.toHaveBeenCalled()
    expect(emailService.sendVerifyEmailOtp).not.toHaveBeenCalled()
  })

  it.each([
    ['email chưa đăng ký', null],
    ['email đã xác thực', makeUser()]
  ])('%s: không gửi mail nhưng vẫn trả về thành công', async (_case, user) => {
    repo.findByEmail.mockResolvedValue(user)

    await expect(AuthService.resendVerification({ email: 'binh.tran@yahoo.com' })).resolves.toBeUndefined()
    expect(emailService.sendVerifyEmailOtp).not.toHaveBeenCalled()
  })

  it('gửi mail lỗi thì chỉ ghi log, API vẫn trả về thành công', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    repo.findByEmail.mockResolvedValue(unverifiedUser)
    repo.findLatestAuthToken.mockResolvedValue(null)
    emailService.sendVerifyEmailOtp.mockRejectedValue(new Error('SMTP down'))

    await expect(AuthService.resendVerification({ email: unverifiedUser.email })).resolves.toBeUndefined()
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith(expect.any(Error), 'Failed to send email'))
  })
})

describe('AuthService.login', () => {
  const dto = { identifier: 'an.nguyen@gmail.com', password: PASSWORD }

  it('trả về token và thông tin user khi đăng nhập đúng', async () => {
    const user = makeUser()
    repo.findByEmailOrPhoneWithPassword.mockResolvedValue(user)

    const result = await AuthService.login(dto, AUTH_SCOPE.CLIENT)

    expect(JWTService.verifyAccessToken(result.accessToken)).toMatchObject({ sub: user.id, role: user.role })
    expect(JWTService.verifyRefreshToken(result.refreshToken)).toMatchObject({ sub: user.id })
    expect(result.user).toMatchObject({ id: user.id, email: user.email })
    expect(repo.updateLastLogin).toHaveBeenCalledWith(user.id)
    expect(repo.saveRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, tokenHash: JWTService.hashRefreshToken(result.refreshToken) })
    )
  })

  it.each([
    ['tài khoản không tồn tại', null],
    ['tài khoản chưa có mật khẩu', makeUser({ password: null })],
    ['sai mật khẩu', makeUser({ password: fakeHash('Khac@2026') })]
  ])('trả 401 với cùng một thông báo khi %s', async (_case, user) => {
    repo.findByEmailOrPhoneWithPassword.mockResolvedValue(user)

    await expect(AuthService.login(dto, AUTH_SCOPE.CLIENT)).rejects.toThrow(
      new UnauthorizedError('Email/số điện thoại hoặc mật khẩu không đúng')
    )
  })

  it('chặn tài khoản chưa xác thực email', async () => {
    repo.findByEmailOrPhoneWithPassword.mockResolvedValue(makeUser({ isEmailVerified: false }))

    await expect(AuthService.login(dto, AUTH_SCOPE.CLIENT)).rejects.toThrow(ForbiddenError)
    expect(repo.saveRefreshToken).not.toHaveBeenCalled()
  })

  it('trang admin chỉ cho tài khoản admin đăng nhập', async () => {
    repo.findByEmailOrPhoneWithPassword.mockResolvedValue(makeUser())

    await expect(AuthService.login(dto, AUTH_SCOPE.ADMIN)).rejects.toThrow(
      'Tài khoản không có quyền truy cập trang quản trị'
    )
  })

  it('admin đăng nhập được trang admin', async () => {
    repo.findByEmailOrPhoneWithPassword.mockResolvedValue(makeUser({ role: USER_ROLE.ADMIN }))

    await expect(AuthService.login(dto, AUTH_SCOPE.ADMIN)).resolves.toHaveProperty('accessToken')
  })
})

describe('AuthService.refreshToken', () => {
  const refreshToken = 'current-refresh-token'

  it('cấp cặp token mới, xoá token cũ và giữ nguyên hạn tối đa của phiên', async () => {
    const stored = makeRefreshToken()
    repo.findRefreshToken.mockResolvedValue(stored)
    repo.findById.mockResolvedValue(makeUser())

    const tokens = await AuthService.refreshToken(refreshToken, 'user-1', AUTH_SCOPE.CLIENT)

    expect(repo.findRefreshToken).toHaveBeenCalledWith(JWTService.hashRefreshToken(refreshToken))
    expect(repo.deleteRefreshTokenById).toHaveBeenCalledWith(stored.id)
    expect(repo.saveRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: JWTService.hashRefreshToken(tokens.refreshToken),
        absoluteExpiresAt: stored.absoluteExpiresAt
      })
    )
  })

  it.each([
    ['token không có trong DB (đã bị thu hồi)', null],
    ['token thuộc user khác', makeRefreshToken({ userId: 'user-2' })],
    ['token đã hết hạn', makeRefreshToken({ expiresAt: secondsAgo(1) })],
    ['phiên vượt quá thời gian tối đa', makeRefreshToken({ absoluteExpiresAt: secondsAgo(1) })]
  ])('trả 401 khi %s', async (_case, stored) => {
    repo.findRefreshToken.mockResolvedValue(stored)

    await expect(AuthService.refreshToken(refreshToken, 'user-1', AUTH_SCOPE.CLIENT)).rejects.toThrow(UnauthorizedError)
    expect(repo.saveRefreshToken).not.toHaveBeenCalled()
  })
})

describe('AuthService.logout', () => {
  it('xoá refresh token hiện tại', async () => {
    await AuthService.logout('current-refresh-token')

    expect(repo.deleteRefreshToken).toHaveBeenCalledWith(JWTService.hashRefreshToken('current-refresh-token'))
  })

  it('không làm gì khi không có refresh token', async () => {
    await AuthService.logout()

    expect(repo.deleteRefreshToken).not.toHaveBeenCalled()
  })
})

describe('AuthService.forgotPassword', () => {
  it('gửi OTP đặt lại mật khẩu cho tài khoản đã xác thực', async () => {
    const user = makeUser()
    repo.findByEmail.mockResolvedValue(user)
    repo.findLatestAuthToken.mockResolvedValue(null)

    await AuthService.forgotPassword({ email: user.email })

    const otp = sentOtp(emailService.sendResetPasswordOtp)
    expect(emailService.sendResetPasswordOtp).toHaveBeenCalledWith(user.email, otp, user.fullName)
    expect(repo.replaceAuthToken).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ type: AUTH_TOKEN.RESET_PASSWORD, tokenHash: hashAuthToken(otp) })
    )
  })

  it.each([
    ['email chưa đăng ký', null],
    ['email chưa xác thực', makeUser({ isEmailVerified: false })]
  ])('%s: không gửi mail nhưng vẫn trả về thành công', async (_case, user) => {
    repo.findByEmail.mockResolvedValue(user)

    await expect(AuthService.forgotPassword({ email: 'an.nguyen@gmail.com' })).resolves.toBeUndefined()
    expect(emailService.sendResetPasswordOtp).not.toHaveBeenCalled()
  })
})

describe('AuthService.resetPassword', () => {
  const dto = { email: 'an.nguyen@gmail.com', otp: '123456', password: 'GomSu@2027', confirmPassword: 'GomSu@2027' }

  it('đổi mật khẩu khi OTP đúng', async () => {
    repo.findByEmail.mockResolvedValue(makeUser())
    repo.findActiveAuthToken.mockResolvedValue(makeAuthToken('123456', { type: AUTH_TOKEN.RESET_PASSWORD }))

    await AuthService.resetPassword(dto)

    expect(repo.findActiveAuthToken).toHaveBeenCalledWith('user-1', AUTH_TOKEN.RESET_PASSWORD)
    expect(repo.resetPassword).toHaveBeenCalledWith('user-1', 'auth-token-1', fakeHash('GomSu@2027'))
  })

  it('báo lỗi khi tài khoản chưa xác thực email', async () => {
    repo.findByEmail.mockResolvedValue(makeUser({ isEmailVerified: false }))

    await expect(AuthService.resetPassword(dto)).rejects.toThrow(BadRequestError)
    expect(repo.resetPassword).not.toHaveBeenCalled()
  })
})

describe('AuthService.requestChangeEmail', () => {
  const dto = { newEmail: 'email.moi@gmail.com', password: PASSWORD }

  beforeEach(() => {
    repo.findByIdWithPassword.mockResolvedValue(makeUser())
  })

  it('gửi OTP tới email MỚI và lưu email mới kèm mã', async () => {
    repo.findByEmail.mockResolvedValue(null)
    repo.findLatestAuthToken.mockResolvedValue(null)

    await AuthService.requestChangeEmail('user-1', dto)

    const otp = sentOtp(emailService.sendChangeEmailOtp)
    expect(emailService.sendChangeEmailOtp).toHaveBeenCalledWith('email.moi@gmail.com', otp, 'Nguyễn Văn An')
    expect(repo.replaceAuthToken).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ type: AUTH_TOKEN.CHANGE_EMAIL, newEmail: 'email.moi@gmail.com' })
    )
  })

  it('báo lỗi khi nhập sai mật khẩu', async () => {
    await expect(AuthService.requestChangeEmail('user-1', { ...dto, password: 'Sai@2026' })).rejects.toThrow(
      'Mật khẩu không đúng'
    )
    expect(emailService.sendChangeEmailOtp).not.toHaveBeenCalled()
  })

  it('báo lỗi khi email mới trùng email hiện tại', async () => {
    await expect(AuthService.requestChangeEmail('user-1', { ...dto, newEmail: 'an.nguyen@gmail.com' })).rejects.toThrow(
      'Email mới phải khác email hiện tại'
    )
  })

  it('báo trùng khi email mới thuộc tài khoản khác đã xác thực', async () => {
    repo.findByEmail.mockResolvedValue(makeUser({ id: 'user-2', email: dto.newEmail }))

    await expect(AuthService.requestChangeEmail('user-1', dto)).rejects.toThrow(ConflictError)
  })

  it('báo lỗi 429 khi yêu cầu mã mới trong vòng 60 giây', async () => {
    repo.findByEmail.mockResolvedValue(null)
    repo.findLatestAuthToken.mockResolvedValue(makeAuthToken('111111', { createdAt: secondsAgo(5) }))

    await expect(AuthService.requestChangeEmail('user-1', dto)).rejects.toThrow(TooManyRequestsError)
    expect(emailService.sendChangeEmailOtp).not.toHaveBeenCalled()
  })

  it('báo lỗi khi không tìm thấy user', async () => {
    repo.findByIdWithPassword.mockResolvedValue(null)

    await expect(AuthService.requestChangeEmail('user-1', dto)).rejects.toThrow(NotFoundError)
  })
})

describe('AuthService.verifyChangeEmail', () => {
  const changeEmailToken = makeAuthToken('123456', { type: AUTH_TOKEN.CHANGE_EMAIL, newEmail: 'email.moi@gmail.com' })

  it('đổi sang email mới và báo về email cũ', async () => {
    repo.findById.mockResolvedValue(makeUser())
    repo.findActiveAuthToken.mockResolvedValue(changeEmailToken)
    repo.findByEmail.mockResolvedValue(null)
    repo.changeEmail.mockResolvedValue(makeUser({ email: 'email.moi@gmail.com' }))

    const result = await AuthService.verifyChangeEmail('user-1', { otp: '123456' })

    expect(repo.changeEmail).toHaveBeenCalledWith('user-1', 'auth-token-1', 'email.moi@gmail.com', undefined)
    expect(emailService.sendEmailChangedNotice).toHaveBeenCalledWith(
      'an.nguyen@gmail.com',
      'email.moi@gmail.com',
      'Nguyễn Văn An'
    )
    expect(result.email).toBe('email.moi@gmail.com')
  })

  it('xoá tài khoản đăng ký dở dang đang giữ email mới', async () => {
    repo.findById.mockResolvedValue(makeUser())
    repo.findActiveAuthToken.mockResolvedValue(changeEmailToken)
    repo.findByEmail.mockResolvedValue(makeUser({ id: 'pending', isEmailVerified: false }))
    repo.changeEmail.mockResolvedValue(makeUser({ email: 'email.moi@gmail.com' }))

    await AuthService.verifyChangeEmail('user-1', { otp: '123456' })

    expect(repo.changeEmail).toHaveBeenCalledWith('user-1', 'auth-token-1', 'email.moi@gmail.com', 'pending')
  })

  it('báo trùng khi email mới vừa bị tài khoản khác đăng ký và xác thực trong lúc chờ nhập mã', async () => {
    repo.findById.mockResolvedValue(makeUser())
    repo.findActiveAuthToken.mockResolvedValue(changeEmailToken)
    repo.findByEmail.mockResolvedValue(makeUser({ id: 'user-2', email: 'email.moi@gmail.com' }))

    await expect(AuthService.verifyChangeEmail('user-1', { otp: '123456' })).rejects.toThrow(ConflictError)
    expect(repo.changeEmail).not.toHaveBeenCalled()
  })

  it('sai OTP thì không đổi email', async () => {
    repo.findById.mockResolvedValue(makeUser())
    repo.findActiveAuthToken.mockResolvedValue(changeEmailToken)

    await expect(AuthService.verifyChangeEmail('user-1', { otp: '000000' })).rejects.toThrow(BadRequestError)
    expect(repo.changeEmail).not.toHaveBeenCalled()
  })
})

describe('AuthService.changePassword', () => {
  const dto = { currentPassword: PASSWORD, newPassword: 'GomSu@2027', confirmPassword: 'GomSu@2027' }

  it('đổi mật khẩu, cấp token mới cho thiết bị hiện tại và gửi mail thông báo', async () => {
    const user = makeUser()
    repo.findByIdWithPassword.mockResolvedValue(user)

    const tokens = await AuthService.changePassword(user.id, dto)

    expect(repo.changePassword).toHaveBeenCalledWith(user.id, fakeHash('GomSu@2027'))
    expect(JWTService.verifyAccessToken(tokens.accessToken)).toMatchObject({ sub: user.id })
    expect(emailService.sendPasswordChangedNotice).toHaveBeenCalledWith(user.email, user.fullName)
  })

  it('báo lỗi 400 (không phải 401) khi sai mật khẩu hiện tại', async () => {
    repo.findByIdWithPassword.mockResolvedValue(makeUser())

    await expect(AuthService.changePassword('user-1', { ...dto, currentPassword: 'Sai@2026' })).rejects.toThrow(
      new BadRequestError('Mật khẩu hiện tại không đúng')
    )
    expect(repo.changePassword).not.toHaveBeenCalled()
  })
})
