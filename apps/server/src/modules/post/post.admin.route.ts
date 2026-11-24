import { Router } from 'express'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import { idParamSchema } from '@common/validators'

import { AdminPostQuerySchema, CreatePostBodySchema, UpdatePostBodySchema } from './dto'
import PostController from './post.controller'

// US-22: Quản lý bài viết — mount tại /admin/posts, chỉ admin
const router = Router()

router.get('/', validateQuery(AdminPostQuerySchema), PostController.listForAdmin)
router.get('/:id', validateParam(idParamSchema), PostController.getForAdmin)
router.post('/', validateBody(CreatePostBodySchema), PostController.create)
router.patch('/:id', validateParam(idParamSchema), validateBody(UpdatePostBodySchema), PostController.update)
router.delete('/:id', validateParam(idParamSchema), PostController.remove)

export default router
