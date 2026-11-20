import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'

import { AdminRegistrationQuerySchema, RegistrationIdParamSchema, UpdateRegistrationStatusBodySchema } from './dto'
import WorkshopRegistrationController from './workshop-registration.controller'

// US-13: Quản lý đăng ký workshop — mount tại /admin/workshop-registrations, chỉ admin
const router = Router()

router.get('/', validateQuery(AdminRegistrationQuerySchema), WorkshopRegistrationController.listForAdmin)
router.patch(
  '/:id/status',
  validateParam(RegistrationIdParamSchema),
  validateBody(UpdateRegistrationStatusBodySchema),
  WorkshopRegistrationController.updateStatus
)

export default router
