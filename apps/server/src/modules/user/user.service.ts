import { instanceToPlain } from 'class-transformer'

import { NotFoundError } from '@common/errors'
import { AuthUser } from '@common/types'

import UserRepository from './user.repository'

class UserService {
  static async getUserInfo(id: string): Promise<AuthUser> {
    const user = await UserRepository.getUserById(id)
    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng')
    }

    return instanceToPlain(user) as AuthUser
  }
}

export default UserService
