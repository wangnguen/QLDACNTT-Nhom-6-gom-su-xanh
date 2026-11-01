import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { AdminProductQuerySchema, CreateProductBodySchema, UpdateProductBodySchema } from './dto'
import ProductController from './product.controller'

// US-07: Quản lý sản phẩm — mount tại /admin/products, chỉ admin
const router = Router()

router.get('/', validateQuery(AdminProductQuerySchema), ProductController.listForAdmin)
router.get('/:id', validateParam(idParamSchema), ProductController.getForAdmin)
router.post('/', validateBody(CreateProductBodySchema), ProductController.create)
router.patch('/:id', validateParam(idParamSchema), validateBody(UpdateProductBodySchema), ProductController.update)
router.delete('/:id', validateParam(idParamSchema), ProductController.remove)

export default router
