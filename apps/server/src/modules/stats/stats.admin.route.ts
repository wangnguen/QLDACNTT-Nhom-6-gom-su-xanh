import { Router } from 'express'

import { validateQuery } from '@common/middlewares'

import { RevenueQuerySchema } from './dto'
import StatsController from './stats.controller'

// US-26: Báo cáo, thống kê — mount tại /admin/stats, chỉ admin
const router = Router()

router.get('/revenue', validateQuery(RevenueQuerySchema), StatsController.revenue)

export default router
