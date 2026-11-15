import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'

import {
  CancelRegistrationBodySchema,
  CreateRegistrationBodySchema,
  MyRegistrationQuerySchema,
  RegistrationIdParamSchema
} from './dto'
import WorkshopRegistrationController from './workshop-registration.controller'

// Mount tại /workshop-registrations, cần đăng nhập
const router = Router()

// US-12: Đăng ký lớp workshop
router.post('/', validateBody(CreateRegistrationBodySchema), WorkshopRegistrationController.register)

// US-13: Lịch workshop của tôi, tự huỷ đăng ký
router.get('/', validateQuery(MyRegistrationQuerySchema), WorkshopRegistrationController.listMine)
router.patch(
  '/:id/cancel',
  validateParam(RegistrationIdParamSchema),
  validateBody(CancelRegistrationBodySchema),
  WorkshopRegistrationController.cancel
)

export default router
