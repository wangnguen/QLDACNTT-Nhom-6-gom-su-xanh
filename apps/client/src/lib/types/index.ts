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

// ─── US-14..US-17: Đơn hàng và thanh toán ────────────────────────────────────

// pending = chờ xác nhận, confirmed = đang chuẩn bị, shipping = đang giao, returned = giao không thành công
export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned'
export type PaymentMethod = 'cod' | 'vnpay'
export type PaymentStatus = 'unpaid' | 'paid' | 'refund_pending' | 'refunded'
export type ShippingCarrier = 'ghn' | 'ghtk' | 'viettel_post' | 'vnpost' | 'jt' | 'shop'

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

// Thời điểm là chuỗi ISO 8601 (UTC) do server trả về
export interface OrderDetail {
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
  canPay: boolean
  canCancel: boolean
}

export interface CheckoutRequest {
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note: string | null
  paymentMethod: PaymentMethod
}

export interface CheckoutResult {
  order: OrderDetail
  // Link sang cổng thanh toán (đơn VNPay), null với COD
  paymentUrl: string | null
}

export interface PaymentMethodOption {
  method: PaymentMethod
  enabled: boolean
  // Cổng thanh toán giả lập (môi trường phát triển)
  sandbox: boolean
}

export type TransactionType = 'payment' | 'refund'
export type TransactionStatus = 'pending' | 'success' | 'failed'

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
  // Diễn giải kết quả, vd "Khách hàng huỷ giao dịch"
  message: string
  note: string | null
  createdAt: string
  completedAt: string | null
  order: Pick<OrderDetail, 'id' | 'code' | 'status' | 'total'>
}

export interface PaymentResult {
  transaction: Transaction
  order: OrderDetail
}

export interface MyOrderQuery {
  limit?: number
  offset?: number
  status?: OrderStatus
}

export interface MyTransactionQuery {
  limit?: number
  offset?: number
  type?: TransactionType
  status?: TransactionStatus
  orderId?: string
}

// ─── US-23: Tin tức / blog ───────────────────────────────────────────────────

export interface PostCategoryItem {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  // Số bài đã đăng
  postCount: number
}

export interface PostSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string | null
  category: Pick<PostCategoryItem, 'id' | 'name' | 'slug'>
  publishedAt: string | null
  readingMinutes: number
  viewCount: number
  author: { id: string; fullName: string } | null
}

export interface PostDetail extends PostSummary {
  // Đoạn cách nhau bởi dòng trống, dòng bắt đầu bằng "## " là tiêu đề mục
  content: string
  // Tóm tắt admin tự nhập (null = tóm tắt lấy từ đầu nội dung)
  customExcerpt: string | null
  related: PostSummary[]
}

export interface PostQuery {
  limit?: number
  offset?: number
  // Slug danh mục
  category?: string
  search?: string
}

// ─── US-24: Đánh giá sản phẩm ────────────────────────────────────────────────

export interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  authorName: string
  createdAt: string
  updatedAt: string
  adminReply: string | null
  repliedAt: string | null
}

export interface RatingSummary {
  average: number
  count: number
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>
}

export interface ProductReviews extends Paginated<ReviewItem> {
  summary: RatingSummary
}

export interface MyReviewStatus {
  canReview: boolean
  reason: string | null
  review: (ReviewItem & { isHidden: boolean }) | null
}
