import { Request, Response } from 'express'

import UserService from './user.service'

class UserController {
  static async getUserInfo(req: Request, res: Response) {
    const userId = req.user!.id
    const user = await UserService.getUserInfo(userId)
    return res.ok(user)
  }
}

export default UserController
