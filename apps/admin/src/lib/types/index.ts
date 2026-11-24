export interface ApiErrorBody {
  statusCode: number
  message: string
  path?: string
  timestamp?: string
  errors?: { field: string; message: string; code?: string }[]
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  phone: string | null
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

export interface LoginRequest {
  identifier: string
  password: string
}

// ─── US-07: Danh mục và sản phẩm ─────────────────────────────────────────────

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

export interface CategoryPayload {
  name: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'
export type ProductStatus = 'active' | 'hidden'

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

export interface ProductDetail extends ProductSummary {
  description: string | null
  material: string | null
  dimensions: string | null
  imageUrls: string[]
}

export interface AdminProductQuery {
  limit?: number
  offset?: number
  search?: string
  categoryId?: string
  status?: ProductStatus
  sort?: ProductSort
}

export interface ProductPayload {
  name: string
  categoryId: string
  price: number
  stock: number
  description: string | null
  material: string | null
  dimensions: string | null
  imageUrls: string[]
  isActive: boolean
}

// ─── US-11: Lớp workshop ─────────────────────────────────────────────────────

export type WorkshopSort = 'start_asc' | 'start_desc' | 'price_asc' | 'price_desc' | 'newest'
export type WorkshopStatus = 'active' | 'hidden'
export type WorkshopTime = 'upcoming' | 'past'
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

export interface AdminWorkshopQuery {
  limit?: number
  offset?: number
  search?: string
  status?: WorkshopStatus
  time?: WorkshopTime
  sort?: WorkshopSort
}

export interface WorkshopPayload {
  name: string
  description: string | null
  instructor: string | null
  location: string
  startsAt: string
  endsAt: string
  registrationDeadline: string | null
  price: number
  capacity: number
  imageUrls: string[]
  isActive: boolean
}

// ─── US-13: Đăng ký workshop ─────────────────────────────────────────────────

export type RegistrationStatus = 'pending' | 'confirmed' | 'attended' | 'cancelled'
// Trạng thái admin được chuyển sang
export type RegistrationAction = 'confirmed' | 'attended' | 'cancelled'

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
  workshop: WorkshopRef
}

export interface AdminRegistrationQuery {
  limit?: number
  offset?: number
  search?: string
  workshopId?: string
  status?: RegistrationStatus
}

// ─── US-18..US-20: Đơn hàng, vận chuyển, giao dịch ───────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned'
export type PaymentMethod = 'cod' | 'vnpay'
export type PaymentStatus = 'unpaid' | 'paid' | 'refund_pending' | 'refunded'
export type ShippingCarrier = 'ghn' | 'ghtk' | 'viettel_post' | 'vnpost' | 'jt' | 'shop'
export type TransactionType = 'payment' | 'refund'
export type TransactionStatus = 'pending' | 'success' | 'failed'
// Trạng thái admin chuyển sang ở trang đơn hàng
export type OrderAction = 'confirmed' | 'cancelled'

export interface OrderLine {
  id: string
  productId: string | null
  productName: string
  productSlug: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderCustomer {
  id: string
  fullName: string
  email: string
  phone: string | null
}

export interface AdminOrder {
  id: string
  code: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotal: number
  shippingFee: number
  total: number
  itemCount: number
  items: OrderLine[]
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note: string | null
  placedAt: string
  paidAt: string | null
  confirmedAt: string | null
  cancelReason: string | null
  cancelledBy: 'user' | 'admin' | null
  cancelledAt: string | null
  shippingCarrier: ShippingCarrier | null
  trackingCode: string | null
  shippedAt: string | null
  deliveredAt: string | null
  returnedAt: string | null
  deliveryNote: string | null
  customer: OrderCustomer
}

export interface Transaction {
  id: string
  code: string
  type: TransactionType
  method: PaymentMethod
  amount: number
  status: TransactionStatus
  gatewayTransactionNo: string | null
  bankCode: string | null
  responseCode: string | null
  message: string
  note: string | null
  createdAt: string
  completedAt: string | null
  order: Pick<AdminOrder, 'id' | 'code' | 'status' | 'total'>
}

export interface AdminOrderDetail extends AdminOrder {
  transactions: Transaction[]
}

export interface AdminOrderQuery {
  limit?: number
  offset?: number
  search?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  shippingCarrier?: ShippingCarrier
  // YYYY-MM-DD (giờ Việt Nam)
  from?: string
  to?: string
}

// US-19: Mỗi thao tác vận chuyển một bước
export type ShipmentBody =
  | { action: 'ship' | 'update'; shippingCarrier: ShippingCarrier; trackingCode: string | null }
  | { action: 'deliver' }
  | { action: 'return'; reason: string }
