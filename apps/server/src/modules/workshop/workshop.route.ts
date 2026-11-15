import { Router } from 'express'

import { validateQuery } from '@common/middlewares'

import { WorkshopQuerySchema } from './dto'
import WorkshopController from './workshop.controller'

// Trang client — không cần đăng nhập
const router = Router()

// US-12: Xem danh sách lớp workshop
router.get('/', validateQuery(WorkshopQuerySchema), WorkshopController.list)

// US-12: Xem chi tiết lớp (theo slug, vd /workshops/lop-vuot-gom-tren-ban-xoay-co-ban)
router.get('/:slug', WorkshopController.getBySlug)

export default router
