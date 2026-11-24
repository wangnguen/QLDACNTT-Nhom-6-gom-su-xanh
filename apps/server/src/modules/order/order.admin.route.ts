import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { AdminOrderQuerySchema, UpdateOrderStatusBodySchema, UpdateShipmentBodySchema } from './dto'
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

// US-19: Quản lý vận chuyển — giao cho đơn vị vận chuyển, sửa mã vận đơn, giao thành công, hoàn hàng
router.patch(
  '/:id/shipment',
  validateParam(idParamSchema),
  validateBody(UpdateShipmentBodySchema),
  OrderController.updateShipment
)

export default router
