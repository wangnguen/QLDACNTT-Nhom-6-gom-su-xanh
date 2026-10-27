import { EntityManager, IsNull, MoreThan } from 'typeorm'

import { AuthTokenType } from '@common/constants'

import { AuthToken } from '@entities/auth-token.entity'
import { RefreshToken } from '@entities/refresh-token.entity'
import { User } from '@entities/user.entity'

import AppDataSource from '@databases/data-source'

export type OtpData = {
  tokenHash: string
  type: AuthTokenType
  expiresAt: Date
}

type UnverifiedUserData = Pick<User, 'fullName' | 'email' | 'phone' | 'password'> & { id?: string }

class AuthRepository {
  static findById(id: string) {
    return this.userRepo.findOne({ where: { id } })
  }

  static findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } })
  }

  static findByPhone(phone: string) {
    return this.userRepo.findOne({ where: { phone } })
  }

  static findByEmailOrPhoneWithPassword(identifier: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :identifier OR user.phone = :identifier', { identifier })
      .getOne()
  }

  /**
   * Tạo user mới (hoặc ghi đè user cùng email chưa xác thực) kèm mã OTP xác thực email.
   * `staleUserId`: tài khoản chưa xác thực đang giữ số điện thoại này (đăng ký dở dang) — bị xoá để nhả số điện thoại.
   */
  static saveUnverifiedUserWithOtp(userData: UnverifiedUserData, otp: OtpData, staleUserId?: string) {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const userRepo = manager.getRepository(User)

      if (staleUserId) await userRepo.delete({ id: staleUserId })

      const user = await userRepo.save(userRepo.create(userData))
      await AuthRepository.replaceAuthTokenWith(manager, user.id, otp)

      return user
    })
  }

  static replaceAuthToken(userId: string, otp: OtpData) {
    return AppDataSource.getDataSource().transaction((manager) =>
      AuthRepository.replaceAuthTokenWith(manager, userId, otp)
    )
  }

  static findLatestAuthToken(userId: string, type: AuthTokenType) {
    return this.authTokenRepo.findOne({ where: { userId, type }, order: { createdAt: 'DESC' } })
  }

  static findActiveAuthToken(userId: string, type: AuthTokenType) {
    return this.authTokenRepo.findOne({
      where: { userId, type, usedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' }
    })
  }

  static incrementAuthTokenAttempts(id: string) {
    return this.authTokenRepo.increment({ id }, 'attempts', 1)
  }

  static markEmailVerified(userId: string, authTokenId: string) {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      await manager.getRepository(AuthToken).update(authTokenId, { usedAt: new Date() })
      await manager.getRepository(User).update(userId, { isEmailVerified: true })
    })
  }

  // Đổi mật khẩu bằng OTP và đăng xuất mọi phiên đang mở của user
  static resetPassword(userId: string, authTokenId: string, hashedPassword: string) {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      await manager.getRepository(AuthToken).update(authTokenId, { usedAt: new Date() })
      await manager.getRepository(User).update(userId, { password: hashedPassword })
      await manager.getRepository(RefreshToken).delete({ userId })
    })
  }

  static updateLastLogin(id: string) {
    return this.userRepo.update(id, { lastLoginAt: new Date() })
  }

  static saveRefreshToken(data: { tokenHash: string; userId: string; expiresAt: Date; absoluteExpiresAt: Date }) {
    const newRefreshToken = this.refreshTokenRepo.create({
      token: data.tokenHash,
      userId: data.userId,
      expiresAt: data.expiresAt,
      absoluteExpiresAt: data.absoluteExpiresAt
    })
    return this.refreshTokenRepo.save(newRefreshToken)
  }

  static findRefreshToken(tokenHash: string) {
    return this.refreshTokenRepo.findOne({ where: { token: tokenHash } })
  }

  static deleteRefreshToken(tokenHash: string) {
    return this.refreshTokenRepo.delete({ token: tokenHash })
  }

  static deleteRefreshTokenById(id: string) {
    return this.refreshTokenRepo.delete({ id })
  }

  private static async replaceAuthTokenWith(manager: EntityManager, userId: string, otp: OtpData) {
    const authTokenRepo = manager.getRepository(AuthToken)
    await authTokenRepo.delete({ userId, type: otp.type })
    await authTokenRepo.save(
      authTokenRepo.create({ token: otp.tokenHash, type: otp.type, userId, expiresAt: otp.expiresAt })
    )
  }

  private static get userRepo() {
    return AppDataSource.getDataSource().getRepository(User)
  }

  private static get refreshTokenRepo() {
    return AppDataSource.getDataSource().getRepository(RefreshToken)
  }

  private static get authTokenRepo() {
    return AppDataSource.getDataSource().getRepository(AuthToken)
  }
}

export default AuthRepository
