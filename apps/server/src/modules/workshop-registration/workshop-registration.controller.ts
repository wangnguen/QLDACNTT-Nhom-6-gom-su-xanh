import { Request, Response } from 'express'

import { CreateRegistrationBody } from './dto'
import WorkshopRegistrationService from './workshop-registration.service'

class WorkshopRegistrationController {
  // US-12: Đăng ký lớp workshop
  static async register(req: Request, res: Response) {
    const registration = await WorkshopRegistrationService.register(req.user!.id, req.body as CreateRegistrationBody)
    return res.created(registration, { message: 'Đăng ký thành công, vui lòng chờ cửa hàng xác nhận' })
  }
}

export default WorkshopRegistrationController
