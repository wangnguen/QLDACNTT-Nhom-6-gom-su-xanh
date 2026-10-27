import { EntityManager, IsNull, MoreThan } from 'typeorm'

import { AuthTokenType } from '@common/constants'

import { AuthToken } from '@entities/auth-token.entity'
import { User } from '@entities/user.entity'

import AppDataSource from '@databases/data-source'

export type OtpData = {
  tokenHash: string
  type: AuthTokenType
  expiresAt: Date
}

type UnverifiedUserData = Pick<User, 'fullName' | 'email' | 'phone' | 'password'> & { id?: string }

class AuthRepository {
  static findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } })
  }

  static findByPhone(phone: string) {
    return this.userRepo.findOne({ where: { phone } })
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

  private static get authTokenRepo() {
    return AppDataSource.getDataSource().getRepository(AuthToken)
  }
}

export default AuthRepository
