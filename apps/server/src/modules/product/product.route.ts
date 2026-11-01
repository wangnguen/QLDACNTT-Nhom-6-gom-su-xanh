import { Router } from 'express'

import { validateQuery } from '@common/middlewares'

import { ProductQuerySchema } from './dto'
import ProductController from './product.controller'

// Trang client — không cần đăng nhập
const router = Router()

// US-08: Xem danh sách sản phẩm
router.get('/', validateQuery(ProductQuerySchema), ProductController.list)

// US-09: Xem chi tiết sản phẩm (theo slug, vd /products/binh-hoa-men-lam)
router.get('/:slug', ProductController.getBySlug)

export default router
