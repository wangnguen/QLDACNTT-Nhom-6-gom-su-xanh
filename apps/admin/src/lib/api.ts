export { ApiError, setAccessToken, getAccessToken } from './axios'

export type {
  AuthUser,
  AuthResponse,
  RefreshResponse,
  LoginRequest,
  Paginated,
  CategoryRef,
  CategoryItem,
  CategoryPayload,
  ProductSort,
  ProductStatus,
  ProductSummary,
  ProductDetail,
  AdminProductQuery,
  ProductPayload,
  WorkshopSort,
  WorkshopStatus,
  WorkshopTime,
  WorkshopAvailability,
  WorkshopSummary,
  WorkshopDetail,
  AdminWorkshopQuery,
  WorkshopPayload,
  RegistrationStatus,
  RegistrationAction,
  WorkshopRef,
  WorkshopRegistration,
  AdminRegistrationQuery
} from './types'

export { authService } from './services/auth.service'
export { usersService } from './services/users.service'
export { categoriesService } from './services/categories.service'
export { productsService } from './services/products.service'
export { workshopsService } from './services/workshops.service'
export { registrationsService } from './services/registrations.service'
