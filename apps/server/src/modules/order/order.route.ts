import { Router } from 'express'

import { validateBody, validateParam } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { CreateOrderBodySchema } from './dto'
import OrderController from './order.controller'

// Mount tại /orders, cần đăng nhập
const router = Router()

// US-14: Đặt hàng (từ giỏ hàng) và thanh toán trực tuyến
router.post('/', validateBody(CreateOrderBodySchema), OrderController.checkout)
router.post('/:id/payment', validateParam(idParamSchema), OrderController.pay)

export default router
