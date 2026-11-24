import { Router } from 'express'

import { validateBody, validateParam } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { CreatePostCategoryBodySchema, UpdatePostCategoryBodySchema } from './dto'
import PostCategoryController from './post-category.controller'

// US-21: Quản lý danh mục bài viết — mount tại /admin/post-categories, chỉ admin
const router = Router()

router.get('/', PostCategoryController.listForAdmin)
router.post('/', validateBody(CreatePostCategoryBodySchema), PostCategoryController.create)
router.patch(
  '/:id',
  validateParam(idParamSchema),
  validateBody(UpdatePostCategoryBodySchema),
  PostCategoryController.update
)
router.delete('/:id', validateParam(idParamSchema), PostCategoryController.remove)

export default router
