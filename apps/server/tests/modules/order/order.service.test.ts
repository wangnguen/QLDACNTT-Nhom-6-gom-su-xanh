import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError } from '@common/errors'

import OrderRepository, { CheckoutLine, CheckoutPlan } from '@modules/order/order.repository'
import OrderService, { calculateShippingFee } from '@modules/order/order.service'

import type { Order } from '@entities/order.entity'
import type { PaymentTransaction } from '@entities/payment-transaction.entity'

import { makeOrder, makeOrderItem, makeProduct, makeTransaction } from '../../helpers/factories'

vi.mock('@modules/order/order.repository', () => ({
  default: {
    createFromCart: vi.fn(),
    findById: vi.fn()
  }
}))

vi.mock('@modules/payment/payment.repository', () => ({ default: {} }))

const repo = vi.mocked(OrderRepository)

const body = {
  recipientName: 'Nguyễn Văn An',
  recipientPhone: '0912345678',
  shippingAddress: '12 Bát Tràng, Gia Lâm, Hà Nội',
  note: null,
  paymentMethod: 'cod' as const
}

const line = (overrides: Partial<CheckoutLine> = {}): CheckoutLine => ({
  productId: 'product-1',
  quantity: 2,
  product: makeProduct(),
  categoryActive: true,
  ...overrides
})

// Giả lập repository: gọi `build` với các dòng giỏ hàng như đang giữ khoá, rồi "lưu" dữ liệu nó trả về
const mockCart = (lines: CheckoutLine[]) => {
  let plan: CheckoutPlan | undefined
  repo.createFromCart.mockImplementation(async (_userId, build) => {
    plan = build(lines)
    const order = makeOrder({
      ...plan.order,
      items: plan.items.map((item, i) => makeOrderItem({ ...item, id: `item-${i}` }))
    }) as Order
    const transaction = plan.payment
      ? (makeTransaction({ ...plan.payment, orderId: order.id }) as PaymentTransaction)
      : null
    return { order, transaction }
  })
  return () => plan!
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('calculateShippingFee', () => {
  it('30.000đ, miễn phí từ 1.000.000đ', () => {
    expect(calculateShippingFee(999_999)).toBe(30_000)
    expect(calculateShippingFee(1_000_000)).toBe(0)
  })
})

describe('OrderService.checkout', () => {
  it('COD: chốt giá, tính phí giao hàng, không có link thanh toán', async () => {
    const getPlan = mockCart([line()])

    const result = await OrderService.checkout('user-1', body, '127.0.0.1')

    expect(getPlan().order).toMatchObject({
      userId: 'user-1',
      paymentMethod: 'cod',
      subtotal: 900000,
      shippingFee: 30000,
      total: 930000,
      recipientName: 'Nguyễn Văn An',
      note: null
    })
    expect(getPlan().order.code).toMatch(/^DH[A-Z2-9]{6}$/)
    expect(getPlan().items).toEqual([
      {
        productId: 'product-1',
        productName: 'Bình hoa men lam',
        productSlug: 'binh-hoa-men-lam',
        imageUrl: 'https://example.com/1.jpg',
        unitPrice: 450000,
        quantity: 2,
        lineTotal: 900000
      }
    ])
    expect(getPlan().payment).toBeUndefined()
    expect(result.paymentUrl).toBeNull()
    expect(result.order).toMatchObject({ total: 930000, itemCount: 2, canPay: false })
  })

  it('VNPay: tạo giao dịch chờ thanh toán đúng tổng tiền và trả link sang cổng thanh toán', async () => {
    const getPlan = mockCart([line()])

    const result = await OrderService.checkout('user-1', { ...body, paymentMethod: 'vnpay' }, '127.0.0.1')

    expect(getPlan().payment).toMatchObject({ userId: 'user-1', method: 'vnpay', amount: 930000 })
    expect(getPlan().payment!.code).toMatch(/^TT[A-Z2-9]{8}$/)
    expect(result.paymentUrl).toContain('vnp_Amount=93000000')
    expect(result.order.canPay).toBe(true)
  })

  it('miễn phí giao hàng với đơn từ 1.000.000đ', async () => {
    const getPlan = mockCart([line({ quantity: 3, product: makeProduct({ price: 400000 }) })])

    await OrderService.checkout('user-1', body, '127.0.0.1')

    expect(getPlan().order).toMatchObject({ subtotal: 1200000, shippingFee: 0, total: 1200000 })
  })

  it('chỉ đặt các sản phẩm mua được, sản phẩm có vấn đề ở lại giỏ', async () => {
    const getPlan = mockCart([
      line(),
      line({ productId: 'p-hidden', product: makeProduct({ id: 'p-hidden', isActive: false }) }),
      line({ productId: 'p-category', product: makeProduct({ id: 'p-category' }), categoryActive: false }),
      line({ productId: 'p-stock', quantity: 5, product: makeProduct({ id: 'p-stock', stock: 4 }) }),
      line({ productId: 'p-deleted', product: null })
    ])

    await OrderService.checkout('user-1', body, '127.0.0.1')

    expect(getPlan().items.map((item) => item.productId)).toEqual(['product-1'])
  })

  it.each([
    ['giỏ hàng trống', [], 'Giỏ hàng đang trống'],
    ['không có sản phẩm mua được', [line({ product: makeProduct({ stock: 0 }) })], 'không mua được'],
    [
      'giá trị đơn quá lớn',
      [line({ quantity: 99, product: makeProduct({ price: 100_000_000, stock: 100 }) })],
      'Giá trị đơn hàng quá lớn'
    ]
  ])('từ chối khi %s', async (_case, lines, message) => {
    mockCart(lines)

    await expect(OrderService.checkout('user-1', body, '127.0.0.1')).rejects.toThrow(BadRequestError)
    await expect(OrderService.checkout('user-1', body, '127.0.0.1')).rejects.toThrow(message)
  })
})
