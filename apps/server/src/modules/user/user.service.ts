import { instanceToPlain } from 'class-transformer'

import { ConflictError, NotFoundError } from '@common/errors'
import { AuthUser } from '@common/types'

import { UpdateProfileBody } from './dto'
import UserRepository from './user.repository'

const USER_NOT_FOUND_MESSAGE = 'Không tìm thấy người dùng'

class UserService {
  static async getUserInfo(id: string): Promise<AuthUser> {
    const user = await UserRepository.getUserById(id)
    if (!user) {
      throw new NotFoundError(USER_NOT_FOUND_MESSAGE)
    }

    return instanceToPlain(user) as AuthUser
  }

  // US-06: Cập nhật thông tin cá nhân
  static async updateProfile(id: string, dto: UpdateProfileBody): Promise<AuthUser> {
    const user = await UserRepository.getUserById(id)
    if (!user) throw new NotFoundError(USER_NOT_FOUND_MESSAGE)

    // Số điện thoại cũng dùng để đăng nhập nên không được trùng với tài khoản khác
    let stalePhoneOwnerId: string | undefined
    if (dto.phone && dto.phone !== user.phone) {
      const phoneOwner = await UserRepository.findByPhone(dto.phone)
      if (phoneOwner?.isEmailVerified) throw new ConflictError('Số điện thoại này đã được sử dụng bởi tài khoản khác')
      stalePhoneOwnerId = phoneOwner?.id
    }

    const updatedUser = await UserRepository.updateProfile(id, dto, stalePhoneOwnerId)
    return instanceToPlain(updatedUser) as AuthUser
  }
}

export default UserService
