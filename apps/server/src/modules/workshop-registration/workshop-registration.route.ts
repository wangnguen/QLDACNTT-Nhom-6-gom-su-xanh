import { Router } from 'express'

import { validateBody } from '@common/middlewares'

import { CreateRegistrationBodySchema } from './dto'
import WorkshopRegistrationController from './workshop-registration.controller'

// Mount tại /workshop-registrations, cần đăng nhập
const router = Router()

// US-12: Đăng ký lớp workshop
router.post('/', validateBody(CreateRegistrationBodySchema), WorkshopRegistrationController.register)

export default router
