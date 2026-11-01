import { Router } from 'express'

import { validateQuery } from '@common/middlewares'

import { ProductQuerySchema } from './dto'
import ProductController from './product.controller'

// Trang client — không cần đăng nhập
const router = Router()

// US-08: Xem danh sách sản phẩm
router.get('/', validateQuery(ProductQuerySchema), ProductController.list)

export default router
