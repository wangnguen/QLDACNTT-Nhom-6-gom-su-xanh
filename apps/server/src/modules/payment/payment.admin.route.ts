import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { AdminTransactionQuerySchema, CompleteRefundBodySchema, TransactionSummaryQuerySchema } from './dto'
import PaymentController from './payment.controller'

// US-20: Quản lý giao dịch thanh toán — mount tại /admin/payments, chỉ admin
const router = Router()

router.get('/', validateQuery(AdminTransactionQuerySchema), PaymentController.listForAdmin)
router.get('/summary', validateQuery(TransactionSummaryQuerySchema), PaymentController.summary)
router.patch(
  '/:id/refund',
  validateParam(idParamSchema),
  validateBody(CompleteRefundBodySchema),
  PaymentController.completeRefund
)

export default router
