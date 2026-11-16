import { Request, Response } from 'express'

import {
  AdminRegistrationQuerySchema,
  CancelRegistrationBody,
  CreateRegistrationBody,
  MyRegistrationQuerySchema,
  UpdateRegistrationStatusBody
} from './dto'
import WorkshopRegistrationService from './workshop-registration.service'

const SUCCESS_MESSAGE: Record<UpdateRegistrationStatusBody['status'], string> = {
  confirmed: 'Đã xác nhận đăng ký',
  attended: 'Đã check-in',
  cancelled: 'Đã huỷ đăng ký'
}

// Express 5 không cho ghi đè req.query nên controller parse lại (query đã qua validateQuery ở route)
class WorkshopRegistrationController {
  // US-12: Đăng ký lớp workshop
  static async register(req: Request, res: Response) {
    const registration = await WorkshopRegistrationService.register(req.user!.id, req.body as CreateRegistrationBody)
    return res.created(registration, { message: 'Đăng ký thành công, vui lòng chờ cửa hàng xác nhận' })
  }

  // US-13: Lịch workshop của tôi
  static async listMine(req: Request, res: Response) {
    const registrations = await WorkshopRegistrationService.listMine(
      req.user!.id,
      MyRegistrationQuerySchema.parse(req.query)
    )
    return res.ok(registrations)
  }

  static async cancel(req: Request<{ id: string }>, res: Response) {
    const registration = await WorkshopRegistrationService.cancelByUser(
      req.user!.id,
      req.params.id,
      req.body as CancelRegistrationBody
    )
    return res.ok(registration, { message: 'Đã huỷ đăng ký' })
  }

  // US-13: Quản lý đăng ký (admin)
  static async listForAdmin(req: Request, res: Response) {
    const registrations = await WorkshopRegistrationService.listForAdmin(AdminRegistrationQuerySchema.parse(req.query))
    return res.ok(registrations)
  }

  static async updateStatus(req: Request<{ id: string }>, res: Response) {
    const body = req.body as UpdateRegistrationStatusBody
    const registration = await WorkshopRegistrationService.updateStatusByAdmin(req.params.id, body)
    return res.ok(registration, { message: SUCCESS_MESSAGE[body.status] })
  }
}

export default WorkshopRegistrationController
