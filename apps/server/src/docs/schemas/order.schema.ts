import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { ORDER_STATUS } from '@common/constants'
import { idParamSchema } from '@common/validators'

import {
  AdminOrderQuerySchema,
  CancelOrderBodySchema,
  CreateOrderBodySchema,
  MyOrderQuerySchema,
  UpdateOrderStatusBodySchema
} from '@modules/order/dto'

import {
  AdminOrderDetailSchema,
  AdminOrderSchema,
  OrderDetailSchema,
  forbiddenResponse,
  badRequestResponse,
  conflictResponse,
  jsonBody,
  notFoundResponse,
  paginatedWrapper,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-14: Đặt hàng và thanh toán trực tuyến ────────────────────────────────

const TAG = 'Đơn hàng - Đặt hàng (US-14)'

const unauthorized = unauthorizedResponse('Chưa đăng nhập hoặc access token hết hạn')

const CheckoutResultSchema = registry.register(
  'CheckoutResult',
  z.object({
    order: OrderDetailSchema,
    paymentUrl: z.string().url().nullable().meta({
      example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=93000000&...',
      description: 'Link chuyển sang cổng thanh toán VNPay; `null` với đơn COD'
    })
  })
)

registry.registerPath({
  method: 'post',
  path: '/orders',
  tags: [TAG],
  summary: 'Đặt hàng từ giỏ hàng',
  description: `Đặt mọi sản phẩm **mua được** trong giỏ (sản phẩm ngừng bán / không đủ hàng ở lại giỏ). Đặt xong sản phẩm được bỏ khỏi giỏ và trừ tồn kho ngay.

- Giá, phí giao hàng chốt tại lúc đặt: phí giao hàng 30.000đ, miễn phí với đơn từ 1.000.000đ
- \`paymentMethod\`:
  - \`cod\`: thanh toán khi nhận hàng
  - \`vnpay\`: trả về \`paymentUrl\` — trang client chuyển khách sang VNPay; link hết hạn sau 15 phút
- Hai khách cùng mua sản phẩm cuối cùng thì chỉ một người đặt được (khoá dòng sản phẩm khi đặt)`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreateOrderBodySchema),
  responses: {
    201: {
      description: 'Đặt hàng thành công',
      content: {
        'application/json': {
          schema: successWrapper(
            CheckoutResultSchema,
            '/orders',
            201,
            'Đặt hàng thành công, đang chuyển sang trang thanh toán'
          )
        }
      }
    },
    400: badRequestResponse('Giỏ hàng trống / không có sản phẩm mua được / chưa nhận thanh toán trực tuyến'),
    401: unauthorized,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/orders/{id}/payment',
  tags: [TAG],
  summary: 'Thanh toán lại đơn VNPay',
  description:
    'Tạo link thanh toán mới cho đơn VNPay chưa thanh toán (link cũ hết hạn, khách huỷ ở cổng thanh toán...). Link cũ không dùng được nữa.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Link thanh toán mới',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({ paymentUrl: z.string().url() }),
            '/orders/{id}/payment',
            200,
            'Đang chuyển sang trang thanh toán'
          )
        }
      }
    },
    400: badRequestResponse('Đơn hàng đã được thanh toán / không thanh toán trực tuyến được'),
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy đơn hàng'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})

// ─── US-15: Xem đơn hàng ─────────────────────────────────────────────────────

const MY_TAG = 'Đơn hàng - Của tôi (US-15)'

registry.registerPath({
  method: 'get',
  path: '/orders',
  tags: [MY_TAG],
  summary: 'Đơn hàng của tôi',
  description: 'Các đơn của tài khoản đang đăng nhập, mới đặt lên trước. Lọc theo `status`.',
  security: [{ bearerAuth: [] }],
  request: { query: MyOrderQuerySchema },
  responses: {
    200: {
      description: 'Danh sách đơn hàng',
      content: { 'application/json': { schema: paginatedWrapper(OrderDetailSchema, '/orders') } }
    },
    401: unauthorized,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/orders/{id}',
  tags: [MY_TAG],
  summary: 'Chi tiết đơn hàng',
  description:
    'Sản phẩm, tiền, người nhận, trạng thái thanh toán và các mốc thời gian của đơn. Đơn của người khác trả 404.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Chi tiết đơn hàng',
      content: { 'application/json': { schema: successWrapper(OrderDetailSchema, '/orders/{id}') } }
    },
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy đơn hàng'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})

// ─── US-16: Huỷ đơn hàng ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'patch',
  path: '/orders/{id}/cancel',
  tags: ['Đơn hàng - Huỷ đơn (US-16)'],
  summary: 'Khách huỷ đơn hàng',
  description: `Chỉ huỷ được đơn của chính mình khi đơn còn \`pending\` (xem \`canCancel\`); đơn đã xác nhận phải liên hệ cửa hàng.

- Sản phẩm trong đơn được trả lại tồn kho
- Đơn đã thanh toán trực tuyến: \`paymentStatus\` chuyển sang \`refund_pending\` và có một giao dịch hoàn tiền chờ cửa hàng xử lý
- Body không bắt buộc; \`reason\` là lý do huỷ`,
  security: [{ bearerAuth: [] }],
  request: {
    params: idParamSchema,
    body: { required: false, content: { 'application/json': { schema: CancelOrderBodySchema } } }
  },
  responses: {
    200: {
      description: 'Đã huỷ đơn hàng',
      content: {
        'application/json': { schema: successWrapper(OrderDetailSchema, '/orders/{id}/cancel', 200, 'Đã huỷ đơn hàng') }
      }
    },
    400: badRequestResponse('Đơn hàng đã được xác nhận / không còn huỷ được'),
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy đơn hàng'),
    409: conflictResponse('Trạng thái đơn hàng vừa thay đổi'),
    422: validationErrorResponse()
  }
})

// ─── US-18: Quản lý đơn hàng (admin) ─────────────────────────────────────────

const ADMIN_TAG = 'Admin - Đơn hàng (US-18)'

const adminErrors = {
  401: unauthorizedResponse('Thiếu hoặc sai access token'),
  403: forbiddenResponse('Bạn không có quyền truy cập')
}

registry.registerPath({
  method: 'get',
  path: '/admin/orders',
  tags: [ADMIN_TAG],
  summary: 'Danh sách đơn hàng',
  description: `Mới đặt lên trước, kèm tài khoản đặt hàng. Phân trang bằng \`limit\`/\`offset\`.

- \`search\`: mã đơn, tên / số điện thoại người nhận, email tài khoản
- \`status\`, \`paymentStatus\`, \`paymentMethod\`
- \`from\`, \`to\`: ngày đặt (YYYY-MM-DD, giờ Việt Nam, tính cả hai ngày)`,
  security: [{ bearerAuth: [] }],
  request: { query: AdminOrderQuerySchema },
  responses: {
    200: {
      description: 'Danh sách đơn hàng',
      content: { 'application/json': { schema: paginatedWrapper(AdminOrderSchema, '/admin/orders') } }
    },
    ...adminErrors,
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/admin/orders/status-counts',
  tags: [ADMIN_TAG],
  summary: 'Số đơn theo từng trạng thái',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Số đơn của mọi trạng thái',
      content: {
        'application/json': {
          schema: successWrapper(
            z.record(z.enum(ORDER_STATUS), z.number().int()).meta({
              example: { pending: 4, confirmed: 2, shipping: 3, delivered: 18, cancelled: 1, returned: 0 }
            }),
            '/admin/orders/status-counts'
          )
        }
      }
    },
    ...adminErrors
  }
})

registry.registerPath({
  method: 'get',
  path: '/admin/orders/{id}',
  tags: [ADMIN_TAG],
  summary: 'Chi tiết đơn hàng',
  description: 'Kèm tài khoản đặt hàng và mọi lượt thanh toán / hoàn tiền của đơn.',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Chi tiết đơn hàng',
      content: { 'application/json': { schema: successWrapper(AdminOrderDetailSchema, '/admin/orders/{id}') } }
    },
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy đơn hàng'),
    422: validationErrorResponse('ID không hợp lệ')
  }
})

registry.registerPath({
  method: 'patch',
  path: '/admin/orders/{id}/status',
  tags: [ADMIN_TAG],
  summary: 'Xác nhận / huỷ đơn hàng',
  description: `- \`confirmed\`: từ \`pending\`; đơn VNPay phải thanh toán xong
- \`cancelled\`: từ \`pending\` hoặc \`confirmed\`, kèm \`cancelReason\` (khách sẽ thấy); trả lại tồn kho, đơn đã thanh toán chuyển sang chờ hoàn tiền

Giao hàng (đang giao / đã giao / hoàn hàng) xử lý ở API vận chuyển.`,
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, ...jsonBody(UpdateOrderStatusBodySchema) },
  responses: {
    200: {
      description: 'Đã cập nhật',
      content: {
        'application/json': {
          schema: successWrapper(AdminOrderDetailSchema, '/admin/orders/{id}/status', 200, 'Đã xác nhận đơn hàng')
        }
      }
    },
    400: badRequestResponse('Không đổi được trạng thái / đơn VNPay chưa thanh toán'),
    ...adminErrors,
    404: notFoundResponse('Không tìm thấy đơn hàng'),
    409: conflictResponse('Trạng thái đơn hàng vừa thay đổi'),
    422: validationErrorResponse()
  }
})
