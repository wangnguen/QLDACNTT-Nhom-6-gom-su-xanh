import { Router } from 'express'

import { USER_ROLE } from '@common/constants'
import AuthenticateMiddleware from '@common/middlewares/auth.middleware'

import AuthRoute from '@modules/auth/auth.route'
import CartRoute from '@modules/cart/cart.route'
import AdminCategoryRoute from '@modules/category/category.admin.route'
import CategoryRoute from '@modules/category/category.route'
import HealthRoute from '@modules/health/health.route'
import AdminOrderRoute from '@modules/order/order.admin.route'
import OrderRoute from '@modules/order/order.route'
import AdminPaymentRoute from '@modules/payment/payment.admin.route'
import PaymentRoute from '@modules/payment/payment.route'
import AdminPostRoute from '@modules/post/post.admin.route'
import AdminPostCategoryRoute from '@modules/post-category/post-category.admin.route'
import PostCategoryRoute from '@modules/post-category/post-category.route'
import AdminProductRoute from '@modules/product/product.admin.route'
import ProductRoute from '@modules/product/product.route'
import UserRoute from '@modules/user/user.route'
import AdminWorkshopRoute from '@modules/workshop/workshop.admin.route'
import WorkshopRoute from '@modules/workshop/workshop.route'
import AdminWorkshopRegistrationRoute from '@modules/workshop-registration/workshop-registration.admin.route'
import WorkshopRegistrationRoute from '@modules/workshop-registration/workshop-registration.route'

const router = Router()

const adminOnly = [AuthenticateMiddleware.authenticate, AuthenticateMiddleware.authorize([USER_ROLE.ADMIN])]

router.use('/auth', AuthRoute)
router.use('/health', HealthRoute)
router.use('/users', AuthenticateMiddleware.authenticate, UserRoute)
router.use('/categories', CategoryRoute)
router.use('/products', ProductRoute)
router.use('/cart', AuthenticateMiddleware.authenticate, CartRoute)
router.use('/orders', AuthenticateMiddleware.authenticate, OrderRoute)
router.use('/payments', PaymentRoute)
router.use('/post-categories', PostCategoryRoute)
router.use('/workshops', WorkshopRoute)
router.use('/workshop-registrations', AuthenticateMiddleware.authenticate, WorkshopRegistrationRoute)

router.use('/admin/categories', ...adminOnly, AdminCategoryRoute)
router.use('/admin/products', ...adminOnly, AdminProductRoute)
router.use('/admin/orders', ...adminOnly, AdminOrderRoute)
router.use('/admin/payments', ...adminOnly, AdminPaymentRoute)
router.use('/admin/post-categories', ...adminOnly, AdminPostCategoryRoute)
router.use('/admin/posts', ...adminOnly, AdminPostRoute)
router.use('/admin/workshops', ...adminOnly, AdminWorkshopRoute)
router.use('/admin/workshop-registrations', ...adminOnly, AdminWorkshopRegistrationRoute)

export default router
