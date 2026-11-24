import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import AuthenticateMiddleware from '@common/middlewares/auth.middleware'
import { idParamSchema } from '@common/validators'

import { CreateReviewBodySchema, ProductReviewQuerySchema, UpdateReviewBodySchema } from './dto'
import ReviewController from './review.controller'

// US-24: Đánh giá của một sản phẩm — mount tại /products/:slug/reviews
export const productReviewRouter = Router({ mergeParams: true })

productReviewRouter.get('/', validateQuery(ProductReviewQuerySchema), ReviewController.listForProduct)
productReviewRouter.get('/me', AuthenticateMiddleware.authenticate, ReviewController.getMine)

// US-24: Viết / sửa đánh giá — mount tại /reviews, cần đăng nhập
const router = Router()

router.post('/', validateBody(CreateReviewBodySchema), ReviewController.create)
router.patch('/:id', validateParam(idParamSchema), validateBody(UpdateReviewBodySchema), ReviewController.update)

export default router
