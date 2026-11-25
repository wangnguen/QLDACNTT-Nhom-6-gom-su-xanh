import { Router } from 'express'

import { validateQuery } from '@common/middlewares'

import { PostQuerySchema } from './dto'
import PostController from './post.controller'

// Trang client — không cần đăng nhập
const router = Router()

// US-23: Danh sách bài viết (lọc theo danh mục, tìm kiếm)
router.get('/', validateQuery(PostQuerySchema), PostController.list)

// US-23: Đọc bài theo slug, vd /posts/phan-biet-men-lam-va-men-ran-bat-trang
router.get('/:slug', PostController.getBySlug)

export default router
