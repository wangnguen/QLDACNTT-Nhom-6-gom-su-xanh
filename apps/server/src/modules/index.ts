import { Router } from 'express'

import AuthRoute from '@modules/auth/auth.route'
import HealthRoute from '@modules/health/health.route'

const router = Router()

router.use('/auth', AuthRoute)
router.use('/health', HealthRoute)

export default router
