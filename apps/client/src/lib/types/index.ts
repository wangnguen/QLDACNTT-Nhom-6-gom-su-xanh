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

export interface ProductDetail extends ProductSummary {
  description: string | null
  material: string | null
  dimensions: string | null
  imageUrls: string[]
}

// ─── US-10: Giỏ hàng ─────────────────────────────────────────────────────────

// null = mua được; còn lại: ngừng bán / hết hàng / số lượng trong giỏ vượt tồn kho
export type CartItemIssue = 'unavailable' | 'out_of_stock' | 'not_enough_stock'

export interface CartLine {
  productId: string
  quantity: number
  product: ProductSummary
  lineTotal: number
  issue: CartItemIssue | null
}

export interface Cart {
  items: CartLine[]
  totalQuantity: number
  subtotal: number
}

// ─── US-12: Workshop ─────────────────────────────────────────────────────────

export type WorkshopSort = 'start_asc' | 'start_desc' | 'price_asc' | 'price_desc' | 'newest'
// open = đang nhận đăng ký, full = hết chỗ, closed = đã qua hạn đăng ký
export type WorkshopAvailability = 'open' | 'full' | 'closed'

// Thời điểm là chuỗi ISO 8601 (UTC) do server trả về
export interface WorkshopSummary {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  instructor: string | null
  location: string
  startsAt: string
  endsAt: string
  registrationClosesAt: string
  price: number
  capacity: number
  bookedSeats: number
  seatsLeft: number
  availability: WorkshopAvailability
  isActive: boolean
}

export interface WorkshopDetail extends WorkshopSummary {
  description: string | null
  registrationDeadline: string | null
  imageUrls: string[]
}

export interface WorkshopQuery {
  limit?: number
  offset?: number
  search?: string
  // YYYY-MM-DD, giờ Việt Nam
  from?: string
  to?: string
  availableOnly?: boolean
  sort?: WorkshopSort
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'attended' | 'cancelled'

export type WorkshopRef = Pick<
  WorkshopSummary,
  'id' | 'name' | 'slug' | 'imageUrl' | 'location' | 'startsAt' | 'endsAt'
>

export interface WorkshopRegistration {
  id: string
  code: string
  seats: number
  unitPrice: number
  totalPrice: number
  contactName: string
  contactPhone: string
  contactEmail: string
  note: string | null
  status: RegistrationStatus
  cancelReason: string | null
  cancelledBy: 'user' | 'admin' | null
  cancelledAt: string | null
  registeredAt: string
  cancellableUntil: string
  canCancel: boolean
  workshop: WorkshopRef
}

// US-13: Lịch workshop của tôi
export interface MyRegistrationQuery {
  limit?: number
  offset?: number
  status?: RegistrationStatus
  workshopId?: string
}

export interface CreateRegistrationRequest {
  workshopId: string
  seats: number
  contactName: string
  contactPhone: string
  note: string | null
}
