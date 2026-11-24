import { z, ZodType } from 'zod/v4'

import { registry } from '@docs/registry'

import {
  ORDER_CANCELLED_BY,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  REGISTRATION_CANCELLED_BY,
  SHIPPING_CARRIER,
  REGISTRATION_STATUS,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  WORKSHOP_AVAILABILITY
} from '@common/constants'

type NamedExample = { summary?: string; description?: string; value?: unknown }

export const jsonBody = (schema: ZodType, examples?: Record<string, NamedExample>) => ({
  body: {
    required: true,
    content: {
      'application/json': {
        schema,
        ...(examples && { examples })
      }
    }
  }
})

export const successWrapper = <T extends z.ZodTypeAny>(
  dataSchema: T,
  pathExample: string,
  statusCode: number = 200,
  message: string = 'OK'
) =>
  z.object({
    statusCode: z.number().meta({ example: statusCode }),
    message: z.string().meta({ example: message }),
    data: dataSchema,
    path: z.string().meta({ example: pathExample }),
    timestamp: z.string().datetime().meta({ example: '2026-10-27T10:30:00.000Z' })
  })

export const ErrorResponseSchema = z.object({
  statusCode: z.number().meta({ example: 400 }),
  message: z.string().meta({ example: 'Bad Request' }),
  path: z.string().meta({ example: '/api/v1/...' }),
  timestamp: z.string().datetime().meta({ example: '2026-10-27T10:30:00.000Z' })
})

const ValidationErrorResponseSchema = z.object({
  statusCode: z.number().meta({ example: 422 }),
  message: z.string().meta({ example: 'Dữ liệu không hợp lệ' }),
  path: z.string().meta({ example: '/api/v1/...' }),
  timestamp: z.string().datetime().meta({ example: '2026-10-27T10:30:00.000Z' }),
  errors: z
    .array(
      z.object({
        field: z.string().meta({ example: 'body.email' }),
        message: z.string().meta({ example: 'Email không hợp lệ' }),
        code: z.string().meta({ example: 'invalid_format' })
      })
    )
    .optional()
})

export const errorResponse = (statusCode: number, description: string, message: string) => ({
  description,
  content: {
    'application/json': {
      schema: ErrorResponseSchema.meta({
        example: { statusCode, message, path: '/api/v1/...', timestamp: '2026-10-27T10:30:00.000Z' }
      })
    }
  }
})

export const validationErrorResponse = (description: string = 'Dữ liệu không hợp lệ') => ({
  description,
  content: {
    'application/json': {
      schema: ValidationErrorResponseSchema
    }
  }
})

export const badRequestResponse = (description: string = 'Bad Request') => errorResponse(400, description, description)

export const unauthorizedResponse = (description: string = 'Unauthorized') =>
  errorResponse(401, description, description)

export const forbiddenResponse = (description: string = 'Forbidden') => errorResponse(403, description, description)

export const notFoundResponse = (description: string = 'Not Found') => errorResponse(404, description, description)

export const conflictResponse = (description: string = 'Conflict') => errorResponse(409, description, description)

export const rateLimitResponse = () =>
  errorResponse(429, 'Gọi API quá nhiều lần (rate limit)', 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút')

export const paginatedWrapper = <T extends z.ZodTypeAny>(itemSchema: T, pathExample: string) =>
  successWrapper(
    z.object({
      limit: z.number().int().meta({ example: 12 }),
      offset: z.number().int().meta({ example: 0 }),
      total_count: z.number().int().meta({ example: 1 }),
      entries: z.array(itemSchema)
    }),
    pathExample
  )

export const nullSuccessResponse = (path: string, message: string) => ({
  description: message,
  content: {
    'application/json': {
      schema: successWrapper(z.null(), path, 200, message)
    }
  }
})

export const TokenPairSchema = registry.register(
  'AccessToken',
  z.object({
    accessToken: z.string().meta({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  })
)

export const AuthUserSchema = registry.register(
  'AuthUser',
  z.object({
    id: z.string().uuid().meta({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    email: z.string().email().meta({ example: 'nguyenvanan@gmail.com' }),
    fullName: z.string().meta({ example: 'Nguyễn Văn An' }),
    phone: z.string().nullable().meta({ example: '0912345678' }),
    gender: z.enum(['male', 'female', 'other']).nullable().meta({ example: 'male' }),
    address: z.string().nullable().meta({ example: '12 Bát Tràng, Gia Lâm, Hà Nội' }),
    role: z.enum(['user', 'admin']).meta({ example: 'user' }),
    avatarUrl: z.string().url().nullable().meta({ example: null }),
    isEmailVerified: z.boolean().meta({ example: true })
  })
)

export const AuthResponseSchema = registry.register(
  'AuthResponse',
  z.object({
    accessToken: z.string().meta({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    user: AuthUserSchema
  })
)

export const CategoryRefSchema = registry.register(
  'CategoryRef',
  z.object({
    id: z.string().uuid().meta({ example: 'c1d2e3f4-a5b6-4789-8abc-def012345678' }),
    name: z.string().meta({ example: 'Bình hoa' }),
    slug: z.string().meta({ example: 'binh-hoa' })
  })
)

export const CategoryItemSchema = registry.register(
  'CategoryItem',
  CategoryRefSchema.extend({
    description: z.string().nullable().meta({ example: 'Bình cắm hoa men lam, men rạn thủ công Bát Tràng' }),
    imageUrl: z.string().url().nullable().meta({ example: 'https://example.com/images/binh-hoa.jpg' }),
    isActive: z.boolean().meta({ example: true }),
    productCount: z.number().int().meta({ example: 12 })
  })
)

export const ProductSummarySchema = registry.register(
  'ProductSummary',
  z.object({
    id: z.string().uuid().meta({ example: '9f1e2d3c-4b5a-4678-9abc-def012345678' }),
    name: z.string().meta({ example: 'Bình hoa men lam vẽ sen' }),
    slug: z.string().meta({ example: 'binh-hoa-men-lam-ve-sen' }),
    price: z.number().int().meta({ example: 450000, description: 'Giá bán (VND)' }),
    stock: z.number().int().meta({ example: 20, description: 'Số lượng tồn kho' }),
    imageUrl: z
      .string()
      .url()
      .nullable()
      .meta({ example: 'https://example.com/images/binh-hoa-sen-1.jpg', description: 'Ảnh đại diện (ảnh đầu tiên)' }),
    isActive: z.boolean().meta({ example: true }),
    category: CategoryRefSchema
  })
)

export const ProductDetailSchema = registry.register(
  'ProductDetail',
  ProductSummarySchema.extend({
    description: z.string().nullable().meta({ example: 'Bình hoa men lam vẽ tay hoạ tiết hoa sen, nung ở 1.300°C.' }),
    material: z.string().nullable().meta({ example: 'Gốm men lam' }),
    dimensions: z.string().nullable().meta({ example: 'Cao 30cm, miệng 10cm' }),
    imageUrls: z.array(z.string().url()).meta({
      example: ['https://example.com/images/binh-hoa-sen-1.jpg', 'https://example.com/images/binh-hoa-sen-2.jpg']
    })
  })
)

export const WorkshopSummarySchema = registry.register(
  'WorkshopSummary',
  z.object({
    id: z.string().uuid().meta({ example: '5b6c7d8e-9f01-4234-8567-89abcdef0123' }),
    name: z.string().meta({ example: 'Lớp vuốt gốm trên bàn xoay cơ bản' }),
    slug: z.string().meta({ example: 'lop-vuot-gom-tren-ban-xoay-co-ban' }),
    imageUrl: z
      .string()
      .url()
      .nullable()
      .meta({ example: 'https://example.com/images/lop-vuot-gom-1.jpg', description: 'Ảnh đại diện (ảnh đầu tiên)' }),
    instructor: z.string().nullable().meta({ example: 'Nghệ nhân Lê Văn Thành' }),
    location: z.string().meta({ example: 'Xưởng Gốm Sứ Xanh, 12 Bát Tràng, Gia Lâm, Hà Nội' }),
    startsAt: z.string().datetime().meta({ example: '2026-12-05T02:00:00.000Z' }),
    endsAt: z.string().datetime().meta({ example: '2026-12-05T04:30:00.000Z' }),
    registrationClosesAt: z.string().datetime().meta({
      example: '2026-12-04T13:00:00.000Z',
      description: 'Thời điểm đóng đăng ký: hạn đăng ký nếu có, không thì là giờ bắt đầu'
    }),
    price: z.number().int().meta({ example: 350000, description: 'Học phí mỗi chỗ (VND), 0 = miễn phí' }),
    capacity: z.number().int().meta({ example: 12, description: 'Số chỗ tối đa' }),
    bookedSeats: z.number().int().meta({ example: 9, description: 'Số chỗ đang được giữ (đăng ký chưa huỷ)' }),
    seatsLeft: z.number().int().meta({ example: 3 }),
    availability: z.enum(WORKSHOP_AVAILABILITY).meta({
      example: 'open',
      description: '`open` = đang nhận đăng ký; `full` = hết chỗ; `closed` = đã qua hạn đăng ký'
    }),
    isActive: z.boolean().meta({ example: true })
  })
)

export const WorkshopDetailSchema = registry.register(
  'WorkshopDetail',
  WorkshopSummarySchema.extend({
    description: z.string().nullable().meta({
      example: 'Làm quen với đất sét, định tâm và vuốt một chiếc cốc hoặc bát nhỏ cùng nghệ nhân.'
    }),
    registrationDeadline: z.string().datetime().nullable().meta({
      example: '2026-12-04T13:00:00.000Z',
      description: 'Hạn đăng ký admin đặt; `null` = nhận đăng ký tới giờ bắt đầu'
    }),
    imageUrls: z.array(z.string().url()).meta({ example: ['https://example.com/images/lop-vuot-gom-1.jpg'] })
  })
)

export const WorkshopRefSchema = registry.register(
  'WorkshopRef',
  WorkshopSummarySchema.pick({
    id: true,
    name: true,
    slug: true,
    imageUrl: true,
    location: true,
    startsAt: true,
    endsAt: true
  })
)

export const WorkshopRegistrationSchema = registry.register(
  'WorkshopRegistration',
  z.object({
    id: z.string().uuid().meta({ example: 'e1f2a3b4-c5d6-4789-8abc-def012345678' }),
    code: z.string().meta({ example: 'WS7K3M9Q', description: 'Mã đăng ký, khách đọc khi check-in' }),
    seats: z.number().int().meta({ example: 2 }),
    unitPrice: z.number().int().meta({ example: 350000, description: 'Học phí mỗi chỗ lúc đăng ký (VND)' }),
    totalPrice: z.number().int().meta({ example: 700000, description: 'seats × unitPrice' }),
    contactName: z.string().meta({ example: 'Nguyễn Văn An' }),
    contactPhone: z.string().meta({ example: '0912345678' }),
    contactEmail: z.string().email().meta({ example: 'nguyenvanan@gmail.com' }),
    note: z.string().nullable().meta({ example: 'Đi cùng một bé 8 tuổi' }),
    status: z.enum(REGISTRATION_STATUS).meta({
      example: 'pending',
      description: '`pending` = chờ xác nhận; `confirmed` = đã xác nhận; `attended` = đã tham gia; `cancelled` = đã huỷ'
    }),
    cancelReason: z.string().nullable().meta({ example: null }),
    cancelledBy: z.enum(REGISTRATION_CANCELLED_BY).nullable().meta({ example: null }),
    cancelledAt: z.string().datetime().nullable().meta({ example: null }),
    registeredAt: z.string().datetime().meta({ example: '2026-11-20T03:15:00.000Z' }),
    cancellableUntil: z.string().datetime().meta({
      example: '2026-12-04T02:00:00.000Z',
      description: 'Khách tự huỷ được tới thời điểm này (trước giờ học 24 tiếng)'
    }),
    canCancel: z.boolean().meta({ example: true, description: 'Khách còn tự huỷ được không' }),
    workshop: WorkshopRefSchema
  })
)

// ─── Đơn hàng và giao dịch thanh toán ────────────────────────────────────────

export const OrderLineSchema = registry.register(
  'OrderLine',
  z.object({
    id: z.string().uuid().meta({ example: '0a1b2c3d-4e5f-4678-9abc-def012345678' }),
    productId: z.string().uuid().nullable().meta({ example: '9f1e2d3c-4b5a-4678-9abc-def012345678' }),
    productName: z.string().meta({ example: 'Bình hoa men lam vẽ sen' }),
    productSlug: z.string().meta({ example: 'binh-hoa-men-lam-ve-sen' }),
    imageUrl: z.string().url().nullable().meta({ example: 'https://example.com/images/binh-hoa-sen-1.jpg' }),
    unitPrice: z.number().int().meta({ example: 450000, description: 'Giá mỗi sản phẩm lúc đặt (VND)' }),
    quantity: z.number().int().meta({ example: 2 }),
    lineTotal: z.number().int().meta({ example: 900000 })
  })
)

export const OrderDetailSchema = registry.register(
  'OrderDetail',
  z.object({
    id: z.string().uuid().meta({ example: '3c4d5e6f-7a8b-4c9d-8e0f-123456789abc' }),
    code: z.string().meta({ example: 'DH7K3M9Q', description: 'Mã đơn hàng' }),
    status: z.enum(ORDER_STATUS).meta({
      example: 'pending',
      description:
        '`pending` = chờ xác nhận; `confirmed` = đã xác nhận; `shipping` = đang giao; `delivered` = đã giao; `cancelled` = đã huỷ; `returned` = giao không thành công, đã hoàn hàng'
    }),
    paymentMethod: z.enum(PAYMENT_METHOD).meta({ example: 'vnpay', description: '`cod` = thanh toán khi nhận hàng' }),
    paymentStatus: z.enum(PAYMENT_STATUS).meta({
      example: 'paid',
      description: '`unpaid`, `paid`, `refund_pending` (chờ cửa hàng hoàn tiền), `refunded`'
    }),
    subtotal: z.number().int().meta({ example: 900000 }),
    shippingFee: z.number().int().meta({ example: 30000, description: 'Miễn phí với đơn từ 1.000.000đ' }),
    total: z.number().int().meta({ example: 930000 }),
    itemCount: z.number().int().meta({ example: 2, description: 'Tổng số lượng sản phẩm' }),
    items: z.array(OrderLineSchema),
    recipientName: z.string().meta({ example: 'Nguyễn Văn An' }),
    recipientPhone: z.string().meta({ example: '0912345678' }),
    shippingAddress: z.string().meta({ example: '12 Bát Tràng, xã Bát Tràng, Gia Lâm, Hà Nội' }),
    note: z.string().nullable().meta({ example: 'Giao giờ hành chính' }),
    placedAt: z.string().datetime().meta({ example: '2026-11-20T03:15:00.000Z' }),
    paidAt: z.string().datetime().nullable().meta({ example: '2026-11-20T03:17:42.000Z' }),
    confirmedAt: z.string().datetime().nullable().meta({ example: null }),
    cancelReason: z.string().nullable().meta({ example: null }),
    cancelledBy: z.enum(ORDER_CANCELLED_BY).nullable().meta({ example: null }),
    cancelledAt: z.string().datetime().nullable().meta({ example: null }),
    shippingCarrier: z.enum(SHIPPING_CARRIER).nullable().meta({
      example: 'ghn',
      description: 'Đơn vị vận chuyển: `ghn`, `ghtk`, `viettel_post`, `vnpost`, `jt`, `shop` (cửa hàng tự giao)'
    }),
    trackingCode: z.string().nullable().meta({ example: 'GHN5K7Q2M9', description: 'Mã vận đơn' }),
    shippedAt: z.string().datetime().nullable().meta({ example: '2026-11-21T02:00:00.000Z' }),
    deliveredAt: z.string().datetime().nullable().meta({ example: null }),
    returnedAt: z.string().datetime().nullable().meta({ example: null }),
    deliveryNote: z.string().nullable().meta({ example: null, description: 'Lý do giao không thành công' }),
    canPay: z.boolean().meta({ example: false, description: 'Còn thanh toán trực tuyến lại được không' }),
    canCancel: z.boolean().meta({ example: true, description: 'Khách còn tự huỷ được không (đơn chờ xác nhận)' })
  })
)

export const OrderRefSchema = registry.register(
  'OrderRef',
  OrderDetailSchema.pick({ id: true, code: true, status: true, total: true })
)

export const TransactionSchema = registry.register(
  'PaymentTransaction',
  z.object({
    id: z.string().uuid().meta({ example: '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b' }),
    code: z.string().meta({ example: 'TT7K3M9QX2', description: 'Mã giao dịch gửi sang cổng thanh toán (vnp_TxnRef)' }),
    type: z
      .enum(TRANSACTION_TYPE)
      .meta({ example: 'payment', description: '`payment` = thanh toán; `refund` = hoàn tiền' }),
    method: z.enum(PAYMENT_METHOD).meta({ example: 'vnpay' }),
    amount: z.number().int().meta({ example: 930000 }),
    status: z.enum(TRANSACTION_STATUS).meta({ example: 'success' }),
    gatewayTransactionNo: z.string().nullable().meta({ example: '14212345', description: 'Mã giao dịch tại VNPay' }),
    bankCode: z.string().nullable().meta({ example: 'NCB' }),
    responseCode: z.string().nullable().meta({ example: '00', description: 'Mã kết quả VNPay, `00` = thành công' }),
    message: z.string().meta({ example: 'Thanh toán thành công' }),
    note: z.string().nullable().meta({ example: null }),
    createdAt: z.string().datetime().meta({ example: '2026-11-20T03:15:00.000Z' }),
    completedAt: z.string().datetime().nullable().meta({ example: '2026-11-20T03:17:42.000Z' }),
    order: OrderRefSchema
  })
)

export const AdminOrderSchema = registry.register(
  'AdminOrder',
  OrderDetailSchema.extend({
    customer: z.object({
      id: z.string().uuid().meta({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
      fullName: z.string().meta({ example: 'Nguyễn Văn An' }),
      email: z.string().email().meta({ example: 'nguyenvanan@gmail.com' }),
      phone: z.string().nullable().meta({ example: '0912345678' })
    })
  })
)

export const AdminOrderDetailSchema = registry.register(
  'AdminOrderDetail',
  AdminOrderSchema.extend({ transactions: z.array(TransactionSchema) })
)

// ─── Tin tức / blog ──────────────────────────────────────────────────────────

export const PostCategoryRefSchema = registry.register(
  'PostCategoryRef',
  z.object({
    id: z.string().uuid().meta({ example: 'd4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f70' }),
    name: z.string().meta({ example: 'Kiến thức gốm' }),
    slug: z.string().meta({ example: 'kien-thuc-gom' })
  })
)

export const PostCategoryItemSchema = registry.register(
  'PostCategoryItem',
  PostCategoryRefSchema.extend({
    description: z.string().nullable().meta({ example: 'Cách nhận biết men, cách dùng và bảo quản đồ gốm' }),
    isActive: z.boolean().meta({ example: true }),
    postCount: z.number().int().meta({ example: 6 })
  })
)
