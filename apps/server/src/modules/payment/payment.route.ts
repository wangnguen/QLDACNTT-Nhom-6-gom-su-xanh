import { Router } from 'express'

import PaymentController from './payment.controller'

// Mount tại /payments — các route dưới đây không cần đăng nhập (kết quả thanh toán được xác thực bằng chữ ký VNPay)
const router = Router()

// US-14: Thanh toán trực tuyến
router.get('/methods', PaymentController.methods)
router.get('/vnpay-return', PaymentController.vnpayReturn)
router.get('/vnpay-ipn', PaymentController.vnpayIpn)
router.get('/sandbox', PaymentController.sandbox)

export default router
