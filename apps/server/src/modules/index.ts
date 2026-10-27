import { Router } from 'express'

import AuthenticateMiddleware from '@common/middlewares/auth.middleware'

import AuthRoute from '@modules/auth/auth.route'
import HealthRoute from '@modules/health/health.route'
import UserRoute from '@modules/user/user.route'

const router = Router()

router.use('/auth', AuthRoute)
router.use('/health', HealthRoute)
router.use('/users', AuthenticateMiddleware.authenticate, UserRoute)

export default router
