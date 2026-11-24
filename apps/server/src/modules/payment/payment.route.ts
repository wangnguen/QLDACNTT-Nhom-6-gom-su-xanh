import { Router } from 'express'

import { validateQuery } from '@common/middlewares'
import AuthenticateMiddleware from '@common/middlewares/auth.middleware'

import { MyTransactionQuerySchema } from './dto'
import PaymentController from './payment.controller'

// Mount tại /payments — các route thanh toán không cần đăng nhập (kết quả được xác thực bằng chữ ký VNPay)
const router = Router()

// US-14: Thanh toán trực tuyến
router.get('/methods', PaymentController.methods)
router.get('/vnpay-return', PaymentController.vnpayReturn)
router.get('/vnpay-ipn', PaymentController.vnpayIpn)
router.get('/sandbox', PaymentController.sandbox)

// US-17: Lịch sử giao dịch của tôi — cần đăng nhập
router.get(
  '/',
  AuthenticateMiddleware.authenticate,
  validateQuery(MyTransactionQuerySchema),
  PaymentController.listMine
)

export default router
