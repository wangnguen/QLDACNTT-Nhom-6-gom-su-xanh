import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { PAYMENT_METHOD } from '@common/constants'
import { idParamSchema } from '@common/validators'

import {
  AdminTransactionQuerySchema,
  CompleteRefundBodySchema,
  MyTransactionQuerySchema,
  TransactionSummaryQuerySchema
} from '@modules/payment/dto'

import {
  OrderDetailSchema,
  TransactionSchema,
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  paginatedWrapper,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-14: Thanh toán trực tuyến ────────────────────────────────────────────

const TAG = 'Thanh toán (US-14)'

registry.registerPath({
  method: 'get',
  path: '/payments/methods',
  tags: [TAG],
  summary: 'Phương thức thanh toán đang nhận',
  description:
    '`vnpay.enabled = false` khi server production chưa cấu hình VNPay. `sandbox = true`: đang dùng cổng thanh toán giả lập (môi trường phát triển).',
  responses: {
    200: {
      description: 'Danh sách phương thức',
      content: {
        'application/json': {
          schema: successWrapper(
            z.array(
              z.object({
                method: z.enum(PAYMENT_METHOD).meta({ example: 'vnpay' }),
                enabled: z.boolean().meta({ example: true }),
                sandbox: z.boolean().meta({ example: false })
              })
            ),
            '/payments/methods'
          )
        }
      }
    }
  }
})

registry.registerPath({
  method: 'get',
  path: '/payments/vnpay-return',
  tags: [TAG],
  summary: 'Ghi nhận kết quả thanh toán (trang kết quả)',
  description: `Trang \`/payment/result\` của client gửi nguyên query VNPay trả về (\`vnp_*\`). Server kiểm tra chữ ký HMAC-SHA512, số tiền, rồi ghi nhận kết quả.

Gọi lại nhiều lần (hoặc sau IPN) không ghi nhận lại — chỉ trả về trạng thái hiện tại.`,
  request: {
    query: z.object({
      vnp_TxnRef: z.string().meta({ example: 'TT7K3M9QX2' }),
      vnp_Amount: z.string().meta({ example: '93000000' }),
      vnp_ResponseCode: z.string().meta({ example: '00' }),
      vnp_SecureHash: z.string().meta({ example: '3f1c...' })
    })
  },
  responses: {
    200: {
      description: 'Kết quả thanh toán',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({ transaction: TransactionSchema, order: OrderDetailSchema }),
            '/payments/vnpay-return',
            200,
            'Thanh toán thành công'
          )
        }
      }
    },
    400: badRequestResponse('Kết quả thanh toán không hợp lệ (sai chữ ký)'),
    404: notFoundResponse('Không tìm thấy giao dịch')
  }
})

registry.registerPath({
  method: 'get',
  path: '/payments/vnpay-ipn',
  tags: [TAG],
  summary: 'IPN — VNPay báo kết quả thanh toán',
  description:
    'VNPay gọi trực tiếp (cần URL public). Trả `{ RspCode, Message }` theo đặc tả VNPay: `00` thành công, `01` không tìm thấy, `02` đã ghi nhận trước đó, `04` sai số tiền, `97` sai chữ ký.',
  responses: {
    200: {
      description: 'Phản hồi cho VNPay',
      content: {
        'application/json': {
          schema: z.object({
            RspCode: z.string().meta({ example: '00' }),
            Message: z.string().meta({ example: 'Confirm Success' })
          })
        }
      }
    }
  }
})

// ─── US-17: Lịch sử giao dịch ────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/payments',
  tags: ['Thanh toán - Lịch sử giao dịch (US-17)'],
  summary: 'Lịch sử giao dịch của tôi',
  description: `Các lượt thanh toán và hoàn tiền của tài khoản đang đăng nhập, mới nhất lên trước.

- \`type\`: \`payment\` (thanh toán) hoặc \`refund\` (hoàn tiền)
- \`status\`: \`pending\`, \`success\`, \`failed\`
- \`orderId\`: các giao dịch của một đơn
- \`message\` diễn giải kết quả, vd "Khách hàng huỷ giao dịch", "Đã hết hạn thanh toán", "Chờ cửa hàng hoàn tiền"`,
  security: [{ bearerAuth: [] }],
  request: { query: MyTransactionQuerySchema },
  responses: {
    200: {
      description: 'Danh sách giao dịch',
      content: { 'application/json': { schema: paginatedWrapper(TransactionSchema, '/payments') } }
    },
    401: unauthorizedResponse('Chưa đăng nhập hoặc access token hết hạn'),
    422: validationErrorResponse()
  }
})

// ─── US-20: Quản lý giao dịch thanh toán (admin) ─────────────────────────────

const ADMIN_TAG = 'Admin - Giao dịch thanh toán (US-20)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

const AdminTransactionSchema = registry.register(
  'AdminPaymentTransaction',
  TransactionSchema.extend({
    customer: z.object({
      id: z.string().uuid().meta({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
      fullName: z.string().meta({ example: 'Nguyễn Văn An' }),
      email: z.string().email().meta({ example: 'nguyenvanan@gmail.com' }),
      phone: z.string().nullable().meta({ example: '0912345678' })
    })
  })
)

registry.registerPath({
  method: 'get',
  path: '/admin/payments',
  tags: [ADMIN_TAG],
  summary: 'Danh sách giao dịch',
  description: `Mọi lượt thanh toán (VNPay, COD) và hoàn tiền, mới nhất lên trước, kèm tài khoản khách.

- \`search\`: mã giao dịch, mã giao dịch VNPay, mã đơn, email khách
- \`type\`, \`status\`, \`method\`
- \`from\`, \`to\`: ngày tạo giao dịch (YYYY-MM-DD, giờ Việt Nam)`,
  security: [{ bearerAuth: [] }],
  request: { query: AdminTransactionQuerySchema },
  responses: {
    200: {
      description: 'Danh sách giao dịch',
      content: { 'application/json': { schema: paginatedWrapper(AdminTransactionSchema, '/admin/payments') } }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/admin/payments/summary',
  tags: [ADMIN_TAG],
  summary: 'Tổng hợp giao dịch',
  description:
    'Tiền đã nhận, đã hoàn và số giao dịch thất bại trong khoảng ngày (bỏ trống = mọi thời điểm). Yêu cầu hoàn tiền đang chờ luôn tính mọi thời điểm.',
  security: [{ bearerAuth: [] }],
  request: { query: TransactionSummaryQuerySchema },
  responses: {
    200: {
      description: 'Tổng hợp',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({
              receivedAmount: z.number().int().meta({ example: 12500000 }),
              receivedCount: z.number().int().meta({ example: 18 }),
              refundedAmount: z.number().int().meta({ example: 930000 }),
              refundedCount: z.number().int().meta({ example: 1 }),
              pendingRefundAmount: z.number().int().meta({ example: 390000 }),
              pendingRefundCount: z.number().int().meta({ example: 1 }),
              failedCount: z.number().int().meta({ example: 4 })
            }),
            '/admin/payments/summary'
          )
        }
      }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/payments/{id}/refund',
  tags: [ADMIN_TAG],
  summary: 'Xác nhận đã hoàn tiền',
  description: `Cửa hàng hoàn tiền cho khách (chuyển khoản / hoàn qua VNPay) rồi xác nhận ở đây. Chỉ áp dụng cho giao dịch \`refund\` đang \`pending\`.

Đơn không còn yêu cầu hoàn nào đang chờ thì \`paymentStatus\` chuyển sang \`refunded\`. Body không bắt buộc.`,
  security: [{ bearerAuth: [] }],
  request: {
    params: idParamSchema,
    body: { required: false, content: { 'application/json': { schema: CompleteRefundBodySchema } } }
  },
  responses: {
    200: {
      description: 'Đã xác nhận hoàn tiền',
      content: {
        'application/json': {
          schema: successWrapper(AdminTransactionSchema, '/admin/payments/{id}/refund', 200, 'Đã xác nhận hoàn tiền')
        }
      }
    },
    400: badRequestResponse('Không phải giao dịch hoàn tiền / đã được xử lý'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy giao dịch'),
    409: conflictResponse('Giao dịch vừa được xử lý'),
    422: validationErrorResponse()
  }
})
