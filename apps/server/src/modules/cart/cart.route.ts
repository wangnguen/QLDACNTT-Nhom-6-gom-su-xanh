import { Router } from 'express'

import { validateBody, validateParam } from '@common/middlewares'

import CartController from './cart.controller'
import { AddCartItemBodySchema, CartProductParamSchema, UpdateCartItemBodySchema } from './dto'

// US-10: Quản lý giỏ hàng — mount tại /cart, cần đăng nhập
const router = Router()

router.get('/', CartController.getCart)
router.delete('/', CartController.clear)
router.post('/items', validateBody(AddCartItemBodySchema), CartController.addItem)
router.patch(
  '/items/:productId',
  validateParam(CartProductParamSchema),
  validateBody(UpdateCartItemBodySchema),
  CartController.updateItem
)
router.delete('/items/:productId', validateParam(CartProductParamSchema), CartController.removeItem)

export default router
