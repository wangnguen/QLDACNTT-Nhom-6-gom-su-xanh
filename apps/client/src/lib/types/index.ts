export interface ApiErrorBody {
  statusCode: number
  message: string
  path?: string
  timestamp?: string
  errors?: { field: string; message: string; code?: string }[]
}

export type Gender = 'male' | 'female' | 'other'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  gender: Gender | null
  address: string | null
  role: 'user' | 'admin'
  avatarUrl: string | null
  isEmailVerified: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export interface RegisterResponse {
  user: AuthUser
}

export interface VerifyEmailRequest {
  email: string
  otp: string
}

export interface EmailRequest {
  email: string
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  password: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  gender?: Gender | null
  address?: string | null
}

export interface ChangeEmailRequest {
  newEmail: string
  password: string
}

export interface OtpRequest {
  otp: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── US-08, US-09: Sản phẩm ──────────────────────────────────────────────────

export interface Paginated<T> {
  limit: number
  offset: number
  total_count: number
  entries: T[]
}

export interface CategoryRef {
  id: string
  name: string
  slug: string
}

export interface CategoryItem extends CategoryRef {
  description: string | null
  imageUrl: string | null
  isActive: boolean
  productCount: number
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'

export interface ProductSummary {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  imageUrl: string | null
  isActive: boolean
  category: CategoryRef
}

export interface ProductQuery {
  limit?: number
  offset?: number
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort?: ProductSort
}
