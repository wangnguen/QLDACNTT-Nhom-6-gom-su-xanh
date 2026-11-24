import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { CancelOrderBodySchema, CreateOrderBodySchema, MyOrderQuerySchema } from './dto'
import OrderController from './order.controller'

// Mount tại /orders, cần đăng nhập
const router = Router()

// US-14: Đặt hàng (từ giỏ hàng) và thanh toán trực tuyến
router.post('/', validateBody(CreateOrderBodySchema), OrderController.checkout)
router.post('/:id/payment', validateParam(idParamSchema), OrderController.pay)

// US-15: Xem danh sách và chi tiết đơn hàng của tôi
router.get('/', validateQuery(MyOrderQuerySchema), OrderController.listMine)
router.get('/:id', validateParam(idParamSchema), OrderController.getMine)

// US-16: Huỷ đơn hàng (khi đơn còn chờ xác nhận)
router.patch('/:id/cancel', validateParam(idParamSchema), validateBody(CancelOrderBodySchema), OrderController.cancel)

export default router
