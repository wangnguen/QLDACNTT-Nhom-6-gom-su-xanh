import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { CART_ITEM_ISSUE } from '@common/constants'

import { AddCartItemBodySchema, CartProductParamSchema, UpdateCartItemBodySchema } from '@modules/cart/dto'

import {
  ProductSummarySchema,
  badRequestResponse,
  jsonBody,
  notFoundResponse,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

// ─── US-10: Quản lý giỏ hàng ─────────────────────────────────────────────────

const TAG = 'Giỏ hàng (US-10)'

const CartSchema = registry.register(
  'Cart',
  z.object({
    items: z.array(
      z.object({
        productId: z.string().uuid().meta({ example: '9f1e2d3c-4b5a-4678-9abc-def012345678' }),
        quantity: z.number().int().meta({ example: 2 }),
        product: ProductSummarySchema,
        lineTotal: z.number().int().meta({ example: 900000, description: 'Giá hiện tại × số lượng' }),
        issue: z.enum(CART_ITEM_ISSUE).nullable().meta({
          example: null,
          description:
            '`null` = mua được; `unavailable` = sản phẩm ngừng bán; `out_of_stock` = hết hàng; `not_enough_stock` = số lượng trong giỏ vượt tồn kho'
        })
      })
    ),
    totalQuantity: z.number().int().meta({ example: 2, description: 'Tổng số lượng (hiện trên biểu tượng giỏ hàng)' }),
    subtotal: z.number().int().meta({ example: 900000, description: 'Tạm tính, chỉ cộng các dòng mua được' })
  })
)

const cartResponse = (path: string, message = 'OK') => ({
  description: message === 'OK' ? 'Giỏ hàng hiện tại' : message,
  content: { 'application/json': { schema: successWrapper(CartSchema, path, 200, message) } }
})

const unauthorized = unauthorizedResponse('Chưa đăng nhập hoặc access token hết hạn')

registry.registerPath({
  method: 'get',
  path: '/cart',
  tags: [TAG],
  summary: 'Xem giỏ hàng',
  description: 'Giỏ hàng lưu trên server theo tài khoản. Giá luôn là giá hiện tại của sản phẩm.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: cartResponse('/cart'),
    401: unauthorized
  }
})

registry.registerPath({
  method: 'post',
  path: '/cart/items',
  tags: [TAG],
  summary: 'Thêm sản phẩm vào giỏ',
  description: `\`quantity\` mặc định 1. Sản phẩm đã có trong giỏ thì cộng dồn số lượng.

Tổng số lượng không vượt quá tồn kho và tối đa 99 mỗi sản phẩm; giỏ chứa tối đa 50 sản phẩm khác nhau.`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(AddCartItemBodySchema),
  responses: {
    200: cartResponse('/cart/items', 'Đã thêm vào giỏ hàng'),
    400: badRequestResponse('Sản phẩm đã ngừng bán / đã hết hàng / không đủ số lượng'),
    401: unauthorized,
    404: notFoundResponse('Không tìm thấy sản phẩm'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/cart/items/{productId}',
  tags: [TAG],
  summary: 'Đổi số lượng một sản phẩm trong giỏ',
  security: [{ bearerAuth: [] }],
  request: { params: CartProductParamSchema, ...jsonBody(UpdateCartItemBodySchema) },
  responses: {
    200: cartResponse('/cart/items/{productId}', 'Đã cập nhật số lượng'),
    400: badRequestResponse('Sản phẩm đã ngừng bán / đã hết hàng / không đủ số lượng'),
    401: unauthorized,
    404: notFoundResponse('Sản phẩm không có trong giỏ hàng'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/cart/items/{productId}',
  tags: [TAG],
  summary: 'Xoá một sản phẩm khỏi giỏ',
  description: 'Sản phẩm không có trong giỏ cũng trả về thành công.',
  security: [{ bearerAuth: [] }],
  request: { params: CartProductParamSchema },
  responses: {
    200: cartResponse('/cart/items/{productId}', 'Đã xoá sản phẩm khỏi giỏ hàng'),
    401: unauthorized,
    422: validationErrorResponse('ID không hợp lệ')
  }
})

registry.registerPath({
  method: 'delete',
  path: '/cart',
  tags: [TAG],
  summary: 'Xoá toàn bộ giỏ hàng',
  security: [{ bearerAuth: [] }],
  responses: {
    200: cartResponse('/cart', 'Đã xoá toàn bộ giỏ hàng'),
    401: unauthorized
  }
})
