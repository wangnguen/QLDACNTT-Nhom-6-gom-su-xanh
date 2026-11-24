import { Request, Response } from 'express'

import { RevenueQuerySchema } from './dto'
import StatsService from './stats.service'

class StatsController {
  // US-26: Thống kê doanh thu (query đã qua validateQuery ở route)
  static async revenue(req: Request, res: Response) {
    return res.ok(await StatsService.revenue(RevenueQuerySchema.parse(req.query)))
  }
}

export default StatsController
