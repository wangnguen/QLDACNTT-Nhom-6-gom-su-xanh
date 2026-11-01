import { Router } from 'express'

import CategoryController from './category.controller'

// Trang client — không cần đăng nhập
const router = Router()

// US-08: Danh mục cho bộ lọc sản phẩm
router.get('/', CategoryController.list)

export default router
