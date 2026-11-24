import { AUTH_TOKEN, AuthTokenType, USER_ROLE } from '@common/constants'
import { hashAuthToken } from '@common/utils/random'

import type { AuthToken } from '@entities/auth-token.entity'
import type { Category } from '@entities/category.entity'
import type { OrderItem } from '@entities/order-item.entity'
import type { Order } from '@entities/order.entity'
import type { PaymentTransaction } from '@entities/payment-transaction.entity'
import type { PostCategory } from '@entities/post-category.entity'
import type { Product } from '@entities/product.entity'
import type { RefreshToken } from '@entities/refresh-token.entity'
import type { User } from '@entities/user.entity'
import type { WorkshopRegistration } from '@entities/workshop-registration.entity'
import type { Workshop } from '@entities/workshop.entity'

// Mật khẩu giả lập: test mock hashPassword thành `hashed:<mật khẩu>` để khỏi chạy bcrypt
export const fakeHash = (plain: string) => `hashed:${plain}`

export const PASSWORD = 'GomSu@2026'

export const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@gmail.com',
    phone: '0912345678',
    gender: null,
    address: null,
    password: fakeHash(PASSWORD),
    role: USER_ROLE.USER,
    avatarUrl: null,
    isEmailVerified: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as User

export const makeAuthToken = (otp: string, overrides: Partial<AuthToken> & { type?: AuthTokenType } = {}): AuthToken =>
  ({
    id: 'auth-token-1',
    token: hashAuthToken(otp),
    type: AUTH_TOKEN.VERIFY_EMAIL,
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    newEmail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as AuthToken

export const makeRefreshToken = (overrides: Partial<RefreshToken> = {}): RefreshToken =>
  ({
    id: 'refresh-token-1',
    token: 'stored-hash',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    absoluteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as RefreshToken

export const makeCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: 'category-1',
    name: 'Bình hoa',
    slug: 'binh-hoa',
    description: null,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as Category

export const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'product-1',
    name: 'Bình hoa men lam',
    slug: 'binh-hoa-men-lam',
    description: 'Vẽ tay hoạ tiết hoa sen',
    price: 450000,
    stock: 20,
    material: 'Gốm men lam',
    dimensions: 'Cao 30cm',
    imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    isActive: true,
    categoryId: 'category-1',
    category: makeCategory(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as Product

const DAY_MS = 24 * 60 * 60 * 1000

// Mặc định: lớp mở sau 7 ngày, học 2,5 tiếng, chưa đặt hạn đăng ký
export const makeWorkshop = (overrides: Partial<Workshop> = {}): Workshop =>
  ({
    id: 'workshop-1',
    name: 'Lớp vuốt gốm cơ bản',
    slug: 'lop-vuot-gom-co-ban',
    description: 'Vuốt một chiếc cốc trên bàn xoay',
    instructor: 'Nghệ nhân Lê Văn Thành',
    location: '12 Bát Tràng, Gia Lâm, Hà Nội',
    startsAt: new Date(Date.now() + 7 * DAY_MS),
    endsAt: new Date(Date.now() + 7 * DAY_MS + 2.5 * 60 * 60 * 1000),
    registrationDeadline: null,
    price: 350000,
    capacity: 12,
    imageUrls: ['https://example.com/ws-1.jpg'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as Workshop

export const makeRegistration = (overrides: Partial<WorkshopRegistration> = {}): WorkshopRegistration =>
  ({
    id: 'registration-1',
    code: 'WS7K3M9Q',
    workshopId: 'workshop-1',
    userId: 'user-1',
    seats: 2,
    unitPrice: 350000,
    totalPrice: 700000,
    contactName: 'Nguyễn Văn An',
    contactPhone: '0912345678',
    contactEmail: 'an.nguyen@gmail.com',
    note: null,
    status: 'pending',
    cancelReason: null,
    cancelledBy: null,
    cancelledAt: null,
    workshop: makeWorkshop(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as WorkshopRegistration

export const makeOrderItem = (overrides: Partial<OrderItem> = {}): OrderItem =>
  ({
    id: 'order-item-1',
    orderId: 'order-1',
    productId: 'product-1',
    productName: 'Bình hoa men lam',
    productSlug: 'binh-hoa-men-lam',
    imageUrl: 'https://example.com/1.jpg',
    unitPrice: 450000,
    quantity: 2,
    lineTotal: 900000,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as OrderItem

// Mặc định: đơn VNPay chờ xác nhận, chưa thanh toán, 2 bình hoa + phí giao hàng
export const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 'order-1',
    code: 'DH7K3M9Q',
    userId: 'user-1',
    status: 'pending',
    paymentMethod: 'vnpay',
    paymentStatus: 'unpaid',
    subtotal: 900000,
    shippingFee: 30000,
    total: 930000,
    recipientName: 'Nguyễn Văn An',
    recipientPhone: '0912345678',
    shippingAddress: '12 Bát Tràng, Gia Lâm, Hà Nội',
    note: null,
    paidAt: null,
    confirmedAt: null,
    cancelReason: null,
    cancelledBy: null,
    cancelledAt: null,
    shippingCarrier: null,
    trackingCode: null,
    shippedAt: null,
    deliveredAt: null,
    returnedAt: null,
    deliveryNote: null,
    items: [makeOrderItem()],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as Order

export const makeTransaction = (overrides: Partial<PaymentTransaction> = {}): PaymentTransaction =>
  ({
    id: 'transaction-1',
    code: 'TT7K3M9QX2',
    orderId: 'order-1',
    userId: 'user-1',
    type: 'payment',
    method: 'vnpay',
    amount: 930000,
    status: 'pending',
    gatewayTransactionNo: null,
    bankCode: null,
    responseCode: null,
    completedAt: null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    note: null,
    order: makeOrder(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as PaymentTransaction

export const makePostCategory = (overrides: Partial<PostCategory> = {}): PostCategory =>
  ({
    id: 'post-category-1',
    name: 'Kiến thức gốm',
    slug: 'kien-thuc-gom',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as PostCategory
