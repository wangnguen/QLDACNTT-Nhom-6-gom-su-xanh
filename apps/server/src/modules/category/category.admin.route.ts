import { Router } from 'express'

import { validateBody, validateParam } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import CategoryController from './category.controller'
import { CreateCategoryBodySchema, UpdateCategoryBodySchema } from './dto'

// US-07: Quản lý danh mục — mount tại /admin/categories, chỉ admin
const router = Router()

router.get('/', CategoryController.listForAdmin)
router.post('/', validateBody(CreateCategoryBodySchema), CategoryController.create)
router.patch('/:id', validateParam(idParamSchema), validateBody(UpdateCategoryBodySchema), CategoryController.update)
router.delete('/:id', validateParam(idParamSchema), CategoryController.remove)

export default router
