import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { AdminReviewQuerySchema, ModerateReviewBodySchema } from './dto'
import ReviewController from './review.controller'

// US-25: Quản lý đánh giá — mount tại /admin/reviews, chỉ admin
const router = Router()

router.get('/', validateQuery(AdminReviewQuerySchema), ReviewController.listForAdmin)
router.patch('/:id', validateParam(idParamSchema), validateBody(ModerateReviewBodySchema), ReviewController.moderate)
router.delete('/:id', validateParam(idParamSchema), ReviewController.remove)

export default router
