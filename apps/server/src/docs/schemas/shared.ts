import { z, ZodType } from 'zod/v4'

import { registry } from '@docs/registry'

import { REGISTRATION_CANCELLED_BY, REGISTRATION_STATUS, WORKSHOP_AVAILABILITY } from '@common/constants'

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
