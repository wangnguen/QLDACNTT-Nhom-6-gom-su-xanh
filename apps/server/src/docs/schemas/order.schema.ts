import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import { CreateOrderBodySchema, MyOrderQuerySchema } from '@modules/order/dto'

import {
  OrderDetailSchema,
  badRequestResponse,
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
