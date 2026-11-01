import { Router } from 'express'

import { USER_ROLE } from '@common/constants'
import AuthenticateMiddleware from '@common/middlewares/auth.middleware'

import AuthRoute from '@modules/auth/auth.route'
import AdminCategoryRoute from '@modules/category/category.admin.route'
import CategoryRoute from '@modules/category/category.route'
import HealthRoute from '@modules/health/health.route'
import AdminProductRoute from '@modules/product/product.admin.route'
import ProductRoute from '@modules/product/product.route'
import UserRoute from '@modules/user/user.route'

const router = Router()

const adminOnly = [AuthenticateMiddleware.authenticate, AuthenticateMiddleware.authorize([USER_ROLE.ADMIN])]

router.use('/auth', AuthRoute)
router.use('/health', HealthRoute)
router.use('/users', AuthenticateMiddleware.authenticate, UserRoute)
router.use('/categories', CategoryRoute)
router.use('/products', ProductRoute)

router.use('/admin/categories', ...adminOnly, AdminCategoryRoute)
router.use('/admin/products', ...adminOnly, AdminProductRoute)

export default router
