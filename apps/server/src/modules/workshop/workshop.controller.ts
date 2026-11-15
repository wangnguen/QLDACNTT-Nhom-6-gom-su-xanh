import { Request, Response } from 'express'

import { AdminWorkshopQuerySchema, CreateWorkshopBody, UpdateWorkshopBody } from './dto'
import WorkshopService from './workshop.service'

// Express 5 không cho ghi đè req.query nên controller parse lại (query đã qua validateQuery ở route)
class WorkshopController {
  // US-11: Quản lý lớp workshop (admin)
  static async listForAdmin(req: Request, res: Response) {
    const workshops = await WorkshopService.listForAdmin(AdminWorkshopQuerySchema.parse(req.query))
    return res.ok(workshops)
  }

  static async getForAdmin(req: Request<{ id: string }>, res: Response) {
    const workshop = await WorkshopService.getForAdmin(req.params.id)
    return res.ok(workshop)
  }

  static async create(req: Request, res: Response) {
    const workshop = await WorkshopService.create(req.body as CreateWorkshopBody)
    return res.created(workshop, { message: 'Đã thêm lớp workshop' })
  }

  static async update(req: Request<{ id: string }>, res: Response) {
    const workshop = await WorkshopService.update(req.params.id, req.body as UpdateWorkshopBody)
    return res.ok(workshop, { message: 'Đã cập nhật lớp workshop' })
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    await WorkshopService.remove(req.params.id)
    return res.ok(null, { message: 'Đã xoá lớp workshop' })
  }
}

export default WorkshopController
