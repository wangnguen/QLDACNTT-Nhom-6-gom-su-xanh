export { ApiError, setAccessToken, getAccessToken } from './axios'

export type {
  AuthUser,
  AuthResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  EmailRequest,
  LoginRequest,
  ResetPasswordRequest,
  Gender,
  UpdateProfileRequest,
  ChangeEmailRequest,
  OtpRequest,
  ChangePasswordRequest,
  Paginated,
  CategoryRef,
  CategoryItem,
  ProductSort,
  ProductSummary,
  ProductDetail,
  ProductQuery,
  CartItemIssue,
  CartLine,
  Cart,
  WorkshopSort,
  WorkshopAvailability,
  WorkshopSummary,
  WorkshopDetail,
  WorkshopQuery,
  RegistrationStatus,
  WorkshopRef,
  WorkshopRegistration,
  CreateRegistrationRequest
} from './types'

export { authService } from './services/auth.service'
export { usersService } from './services/users.service'
export { productsService } from './services/products.service'
export { categoriesService } from './services/categories.service'
export { cartService } from './services/cart.service'
export { workshopsService } from './services/workshops.service'
export { registrationsService } from './services/registrations.service'
