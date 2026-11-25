import { Router } from 'express'

import PostCategoryController from './post-category.controller'

// Trang client — không cần đăng nhập
const router = Router()

// US-21: Danh mục bài viết đang hiện
router.get('/', PostCategoryController.list)

export default router
