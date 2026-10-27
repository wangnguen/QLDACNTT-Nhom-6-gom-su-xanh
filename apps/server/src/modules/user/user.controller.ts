import { Request, Response } from 'express'

import { UpdateProfileBody } from './dto'
import UserService from './user.service'

class UserController {
  static async getUserInfo(req: Request, res: Response) {
    const userId = req.user!.id
    const user = await UserService.getUserInfo(userId)
    return res.ok(user)
  }

  static async updateProfile(req: Request, res: Response) {
    const user = await UserService.updateProfile(req.user!.id, req.body as UpdateProfileBody)
    return res.ok(user, { message: 'Cập nhật thông tin thành công' })
  }
}

export default UserController
