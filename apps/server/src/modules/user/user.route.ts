import { Router } from 'express'

import { validateBody } from '@common/middlewares'

import { UpdateProfileBodySchema } from './dto'
import UserController from './user.controller'

const router = Router()

router.get('/me', UserController.getUserInfo)

// US-06: Quản lý thông tin cá nhân
router.patch('/me', validateBody(UpdateProfileBodySchema), UserController.updateProfile)

export default router
