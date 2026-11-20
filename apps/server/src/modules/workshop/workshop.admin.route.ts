import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { AdminWorkshopQuerySchema, CreateWorkshopBodySchema, UpdateWorkshopBodySchema } from './dto'
import WorkshopController from './workshop.controller'

// US-11: Quản lý lớp workshop — mount tại /admin/workshops, chỉ admin
const router = Router()

router.get('/', validateQuery(AdminWorkshopQuerySchema), WorkshopController.listForAdmin)
router.get('/:id', validateParam(idParamSchema), WorkshopController.getForAdmin)
router.post('/', validateBody(CreateWorkshopBodySchema), WorkshopController.create)
router.patch('/:id', validateParam(idParamSchema), validateBody(UpdateWorkshopBodySchema), WorkshopController.update)
router.delete('/:id', validateParam(idParamSchema), WorkshopController.remove)

export default router
