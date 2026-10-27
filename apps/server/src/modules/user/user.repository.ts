import { User } from '@entities/user.entity'

import AppDataSource from '@databases/data-source'

type ProfileData = Partial<Pick<User, 'fullName' | 'phone' | 'gender' | 'address'>>

class UserRepository {
  static getUserById(id: string) {
    return this.userRepo.findOne({ where: { id } })
  }

  static findByPhone(phone: string) {
    return this.userRepo.findOne({ where: { phone } })
  }

  /**
   * Cập nhật hồ sơ.
   * `staleUserId`: tài khoản chưa xác thực đang giữ số điện thoại mới (đăng ký dở dang) — bị xoá để nhả số điện thoại.
   */
  static updateProfile(id: string, data: ProfileData, staleUserId?: string) {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const userRepo = manager.getRepository(User)

      if (staleUserId) await userRepo.delete({ id: staleUserId })

      await userRepo.update(id, data)
      return userRepo.findOneOrFail({ where: { id } })
    })
  }

  private static get userRepo() {
    return AppDataSource.getDataSource().getRepository(User)
  }
}

export default UserRepository
