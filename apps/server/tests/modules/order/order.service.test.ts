import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'

import OrderRepository, { CheckoutLine, CheckoutPlan, OrderTransition } from '@modules/order/order.repository'
import OrderService, { calculateShippingFee } from '@modules/order/order.service'
import PaymentRepository from '@modules/payment/payment.repository'

import type { Order } from '@entities/order.entity'
import type { PaymentTransaction } from '@entities/payment-transaction.entity'

import { makeOrder, makeOrderItem, makeProduct, makeTransaction, makeUser } from '../../helpers/factories'

vi.mock('@modules/order/order.repository', () => ({
  default: {
    createFromCart: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    transition: vi.fn(),
    countByStatus: vi.fn()
  }
}))

vi.mock('@modules/payment/payment.repository', () => ({ default: { findMany: vi.fn() } }))

const repo = vi.mocked(OrderRepository)
const paymentRepo = vi.mocked(PaymentRepository)

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

describe('OrderService.listMine', () => {
  it('chỉ lấy đơn của chính mình', async () => {
    repo.findMany.mockResolvedValue([[makeOrder(), makeOrder({ id: 'order-2', status: 'cancelled' })], 2])

    const result = await OrderService.listMine('user-1', { limit: 10, offset: 0, status: undefined })

    expect(repo.findMany).toHaveBeenCalledWith({ limit: 10, offset: 0, status: undefined, userId: 'user-1' })
    expect(result).toMatchObject({ limit: 10, offset: 0, total_count: 2 })
    expect(result.entries.map((order) => order.id)).toEqual(['order-1', 'order-2'])
  })
})

describe('OrderService.getMine', () => {
  it('trả chi tiết đơn kèm sản phẩm', async () => {
    repo.findById.mockResolvedValue(
      makeOrder({
        items: [
          makeOrderItem({ id: 'i-2', productName: 'Ấm trà', quantity: 1, unitPrice: 300000, lineTotal: 300000 }),
          makeOrderItem({ id: 'i-1', productName: 'Bình hoa', quantity: 2 })
        ]
      })
    )

    const result = await OrderService.getMine('user-1', 'order-1')

    expect(result).toMatchObject({ code: 'DH7K3M9Q', itemCount: 3, recipientName: 'Nguyễn Văn An' })
    expect(result.items.map((item) => item.productName)).toEqual(['Ấm trà', 'Bình hoa'])
  })

  it.each([
    ['đơn không tồn tại', null],
    ['đơn của người khác', makeOrder({ userId: 'user-2' })]
  ])('báo không tìm thấy khi %s', async (_case, order) => {
    repo.findById.mockResolvedValue(order)

    await expect(OrderService.getMine('user-1', 'order-1')).rejects.toThrow(NotFoundError)
  })
})

describe('OrderService.cancelMine', () => {
  // Giả lập transition: chạy `build` với đơn đang khoá, trả về những gì service muốn ghi
  const mockTransition = (locked: Order) => {
    let transition: OrderTransition | undefined
    repo.transition.mockImplementation(async (_id, from, build) => {
      if (!from.includes(locked.status)) return false
      transition = build(locked)
      return true
    })
    return () => transition!
  }

  it('huỷ đơn chưa thanh toán: ghi lý do, trả lại tồn kho, không hoàn tiền', async () => {
    const order = makeOrder()
    repo.findById.mockResolvedValueOnce(order).mockResolvedValueOnce(makeOrder({ status: 'cancelled' }))
    const getTransition = mockTransition(order)

    const result = await OrderService.cancelMine('user-1', 'order-1', { reason: 'Đặt nhầm' })

    expect(repo.transition).toHaveBeenCalledWith('order-1', ['pending'], expect.any(Function))
    expect(getTransition()).toEqual({
      change: { status: 'cancelled', cancelReason: 'Đặt nhầm', cancelledBy: 'user', cancelledAt: expect.any(Date) },
      restock: true,
      transactions: []
    })
    expect(result).toMatchObject({ status: 'cancelled', canCancel: false, canPay: false })
  })

  it('đơn đã thanh toán: chờ hoàn tiền và tạo giao dịch hoàn đúng số tiền', async () => {
    const order = makeOrder({ paymentStatus: 'paid' })
    repo.findById.mockResolvedValue(order)
    const getTransition = mockTransition(order)

    await OrderService.cancelMine('user-1', 'order-1', { reason: null })

    expect(getTransition().change.paymentStatus).toBe('refund_pending')
    expect(getTransition().transactions).toEqual([
      expect.objectContaining({ type: 'refund', method: 'vnpay', amount: 930000, userId: 'user-1' })
    ])
    expect(getTransition().transactions![0].code).toMatch(/^HT[A-Z2-9]{8}$/)
  })

  it.each([
    ['đơn đã được xác nhận', makeOrder({ status: 'confirmed' }), 'liên hệ cửa hàng'],
    ['đơn đang giao', makeOrder({ status: 'shipping' }), 'đang giao'],
    ['đơn đã huỷ', makeOrder({ status: 'cancelled' }), 'đã huỷ'],
    ['đơn của người khác', makeOrder({ userId: 'user-2' }), NotFoundError]
  ])('không cho huỷ khi %s', async (_case, order, error) => {
    repo.findById.mockResolvedValue(order)

    await expect(OrderService.cancelMine('user-1', 'order-1', { reason: null })).rejects.toThrow(error)
    expect(repo.transition).not.toHaveBeenCalled()
  })

  it('báo tải lại khi cửa hàng vừa xác nhận đơn', async () => {
    repo.findById.mockResolvedValue(makeOrder())
    repo.transition.mockResolvedValue(false)

    await expect(OrderService.cancelMine('user-1', 'order-1', { reason: null })).rejects.toThrow(ConflictError)
  })
})

describe('OrderService (admin)', () => {
  const withCustomer = (overrides: Partial<Order> = {}) => makeOrder({ user: makeUser(), ...overrides })

  beforeEach(() => {
    paymentRepo.findMany.mockResolvedValue([[makeTransaction({ status: 'success' })], 1])
  })

  it('listForAdmin: đổi ngày lọc sang mốc giờ Việt Nam, kèm tài khoản đặt hàng', async () => {
    repo.findMany.mockResolvedValue([[withCustomer()], 1])

    const result = await OrderService.listForAdmin({
      limit: 10,
      offset: 0,
      search: 'DH7K',
      from: '2026-11-20',
      to: '2026-11-21'
    })

    expect(repo.findMany).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      search: 'DH7K',
      placedFrom: new Date('2026-11-19T17:00:00.000Z'),
      placedBefore: new Date('2026-11-21T17:00:00.000Z'),
      withCustomer: true
    })
    expect(result.entries[0].customer).toEqual({
      id: 'user-1',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@gmail.com',
      phone: '0912345678'
    })
  })

  it('countByStatus: đủ mọi trạng thái, chưa có đơn thì là 0', async () => {
    repo.countByStatus.mockResolvedValue(
      new Map([
        ['pending', 3],
        ['delivered', 7]
      ])
    )

    await expect(OrderService.countByStatus()).resolves.toEqual({
      pending: 3,
      confirmed: 0,
      shipping: 0,
      delivered: 7,
      cancelled: 0,
      returned: 0
    })
  })

  it('getForAdmin: kèm các lượt thanh toán của đơn', async () => {
    repo.findById.mockResolvedValue(withCustomer())

    const result = await OrderService.getForAdmin('order-1')

    expect(repo.findById).toHaveBeenCalledWith('order-1', true)
    expect(paymentRepo.findMany).toHaveBeenCalledWith({ orderId: 'order-1', limit: 100, offset: 0 })
    expect(result.transactions).toHaveLength(1)
  })

  describe('updateStatusByAdmin', () => {
    const mockTransition = (locked: Order) => {
      let transition: OrderTransition | undefined
      repo.transition.mockImplementation(async (_id, from, build) => {
        if (!from.includes(locked.status)) return false
        transition = build(locked)
        return true
      })
      return () => transition!
    }

    it('xác nhận đơn COD chờ xác nhận', async () => {
      const order = withCustomer({ paymentMethod: 'cod' })
      repo.findById.mockResolvedValue(order)
      const getTransition = mockTransition(order)

      await OrderService.updateStatusByAdmin('order-1', { status: 'confirmed', cancelReason: undefined })

      expect(getTransition()).toEqual({ change: { status: 'confirmed', confirmedAt: expect.any(Date) } })
    })

    it('xác nhận đơn VNPay đã thanh toán', async () => {
      const order = withCustomer({ paymentStatus: 'paid' })
      repo.findById.mockResolvedValue(order)
      mockTransition(order)

      await expect(
        OrderService.updateStatusByAdmin('order-1', { status: 'confirmed', cancelReason: undefined })
      ).resolves.toBeDefined()
    })

    it('huỷ đơn đã xác nhận: ghi lý do, người huỷ là cửa hàng, trả lại tồn kho', async () => {
      const order = withCustomer({ status: 'confirmed', paymentMethod: 'cod' })
      repo.findById.mockResolvedValue(order)
      const getTransition = mockTransition(order)

      await OrderService.updateStatusByAdmin('order-1', { status: 'cancelled', cancelReason: 'Hết hàng' })

      expect(repo.transition).toHaveBeenCalledWith('order-1', ['pending', 'confirmed'], expect.any(Function))
      expect(getTransition()).toMatchObject({
        change: { status: 'cancelled', cancelReason: 'Hết hàng', cancelledBy: 'admin' },
        restock: true,
        transactions: []
      })
    })

    it.each([
      ['xác nhận đơn VNPay chưa thanh toán', withCustomer(), 'confirmed', 'chưa được thanh toán'],
      ['xác nhận lại đơn đã xác nhận', withCustomer({ status: 'confirmed' }), 'confirmed', 'đã được xác nhận trước đó'],
      ['huỷ đơn đang giao', withCustomer({ status: 'shipping' }), 'cancelled', 'đang giao'],
      ['huỷ đơn đã giao', withCustomer({ status: 'delivered' }), 'cancelled', 'đã giao']
    ] as const)('không cho %s', async (_case, order, status, message) => {
      repo.findById.mockResolvedValue(order)

      await expect(OrderService.updateStatusByAdmin('order-1', { status, cancelReason: undefined })).rejects.toThrow(
        message
      )
      expect(repo.transition).not.toHaveBeenCalled()
    })

    it('không tìm thấy đơn', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(
        OrderService.updateStatusByAdmin('order-1', { status: 'confirmed', cancelReason: undefined })
      ).rejects.toThrow(NotFoundError)
    })
  })
})

describe('OrderService.updateShipment', () => {
  const mockTransition = (locked: Order) => {
    let transition: OrderTransition | undefined
    repo.transition.mockImplementation(async (_id, from, build) => {
      if (!from.includes(locked.status)) return false
      transition = build(locked)
      return true
    })
    return () => transition!
  }

  beforeEach(() => {
    paymentRepo.findMany.mockResolvedValue([[], 0])
  })

  const found = (order: Order) => {
    repo.findById.mockImplementation(
      async (_id, withCustomer) => (withCustomer ? { ...order, user: makeUser() } : order) as Order
    )
  }

  it('ship: đơn đã xác nhận chuyển sang đang giao kèm mã vận đơn', async () => {
    const order = makeOrder({ status: 'confirmed' })
    found(order)
    const getTransition = mockTransition(order)

    await OrderService.updateShipment('order-1', { action: 'ship', shippingCarrier: 'ghn', trackingCode: 'GHN123' })

    expect(repo.transition).toHaveBeenCalledWith('order-1', ['confirmed'], expect.any(Function))
    expect(getTransition()).toEqual({
      change: { status: 'shipping', shippingCarrier: 'ghn', trackingCode: 'GHN123', shippedAt: expect.any(Date) }
    })
  })

  it('update: chỉ sửa thông tin vận chuyển khi đang giao', async () => {
    const order = makeOrder({ status: 'shipping', shippingCarrier: 'ghn', trackingCode: 'GHN123' })
    found(order)
    const getTransition = mockTransition(order)

    await OrderService.updateShipment('order-1', { action: 'update', shippingCarrier: 'shop', trackingCode: null })

    expect(getTransition()).toEqual({ change: { shippingCarrier: 'shop', trackingCode: null } })
  })

  it('deliver đơn COD: đã giao, đã thu tiền và ghi một giao dịch COD thành công', async () => {
    const order = makeOrder({ status: 'shipping', paymentMethod: 'cod' })
    found(order)
    const getTransition = mockTransition(order)

    await OrderService.updateShipment('order-1', { action: 'deliver' })

    expect(getTransition().change).toEqual({
      status: 'delivered',
      deliveredAt: expect.any(Date),
      paymentStatus: 'paid',
      paidAt: expect.any(Date)
    })
    expect(getTransition().transactions).toEqual([
      expect.objectContaining({ method: 'cod', amount: 930000, status: 'success', completedAt: expect.any(Date) })
    ])
  })

  it('deliver đơn VNPay đã thanh toán: không phát sinh giao dịch', async () => {
    const order = makeOrder({ status: 'shipping', paymentStatus: 'paid' })
    found(order)
    const getTransition = mockTransition(order)

    await OrderService.updateShipment('order-1', { action: 'deliver' })

    expect(getTransition()).toEqual({
      change: { status: 'delivered', deliveredAt: expect.any(Date) },
      transactions: []
    })
  })

  it('return đơn đã thanh toán: hoàn hàng, trả tồn kho, chờ hoàn tiền', async () => {
    const order = makeOrder({ status: 'shipping', paymentStatus: 'paid' })
    found(order)
    const getTransition = mockTransition(order)

    await OrderService.updateShipment('order-1', { action: 'return', reason: 'Khách từ chối nhận' })

    expect(getTransition()).toMatchObject({
      change: { status: 'returned', deliveryNote: 'Khách từ chối nhận', paymentStatus: 'refund_pending' },
      restock: true,
      transactions: [expect.objectContaining({ type: 'refund', amount: 930000 })]
    })
  })

  it('return đơn COD chưa thu tiền: không hoàn tiền', async () => {
    const order = makeOrder({ status: 'shipping', paymentMethod: 'cod' })
    found(order)
    const getTransition = mockTransition(order)

    await OrderService.updateShipment('order-1', { action: 'return', reason: 'Sai địa chỉ' })

    expect(getTransition().change.paymentStatus).toBeUndefined()
    expect(getTransition().transactions).toEqual([])
  })

  it.each([
    ['giao đơn chưa xác nhận', makeOrder(), { action: 'ship', shippingCarrier: 'ghn', trackingCode: 'X1' }],
    [
      'giao lại đơn đang giao',
      makeOrder({ status: 'shipping' }),
      { action: 'ship', shippingCarrier: 'ghn', trackingCode: 'X1' }
    ],
    ['xác nhận đã giao khi chưa giao', makeOrder({ status: 'confirmed' }), { action: 'deliver' }],
    ['hoàn hàng đơn đã giao', makeOrder({ status: 'delivered' }), { action: 'return', reason: 'x' }]
  ] as const)('không cho %s', async (_case, order, body) => {
    found(order)

    await expect(OrderService.updateShipment('order-1', body)).rejects.toThrow(BadRequestError)
    expect(repo.transition).not.toHaveBeenCalled()
  })
})
