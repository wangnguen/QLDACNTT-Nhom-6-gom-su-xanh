import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { AdminOrderQuerySchema, UpdateOrderStatusBodySchema } from './dto'
import OrderController from './order.controller'

// US-18: Quản lý đơn hàng — mount tại /admin/orders, chỉ admin
const router = Router()

router.get('/', validateQuery(AdminOrderQuerySchema), OrderController.listForAdmin)
router.get('/status-counts', OrderController.countByStatus)
router.get('/:id', validateParam(idParamSchema), OrderController.getForAdmin)
router.patch(
  '/:id/status',
  validateParam(idParamSchema),
  validateBody(UpdateOrderStatusBodySchema),
  OrderController.updateStatus
)

export default router
