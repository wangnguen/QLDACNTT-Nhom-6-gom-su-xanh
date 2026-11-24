import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, NotFoundError } from '@common/errors'
import VnpayService from '@common/services/vnpay.service'

import OrderRepository from '@modules/order/order.repository'
import PaymentRepository from '@modules/payment/payment.repository'
import PaymentService from '@modules/payment/payment.service'

import type { PaymentTransaction } from '@entities/payment-transaction.entity'

import { makeOrder, makeTransaction, makeUser } from '../../helpers/factories'

vi.mock('@modules/order/order.repository', () => ({
  default: {
    createFromCart: vi.fn(),
    findById: vi.fn()
  }
}))

vi.mock('@modules/payment/payment.repository', () => ({
  default: {
    findByCode: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    findByIdWithCustomer: vi.fn(),
    summarize: vi.fn(),
    pendingRefunds: vi.fn(),
    completeRefund: vi.fn(),
    createPayment: vi.fn(),
    applyGatewayResult: vi.fn()
  }
}))

const orderRepo = vi.mocked(OrderRepository)
const repo = vi.mocked(PaymentRepository)

const queryOf = (url: string) => Object.fromEntries(new URL(url).searchParams)

// Kết quả VNPay (qua cổng giả lập — cùng thuật toán ký) cho giao dịch `transaction`
const gatewayResult = (transaction: PaymentTransaction, success: boolean) =>
  queryOf(
    VnpayService.buildSandboxReturn(
      queryOf(PaymentService.buildPaymentUrl(transaction, transaction.order, '127.0.0.1')),
      success
    )!
  )

beforeEach(() => {
  vi.resetAllMocks()
  repo.applyGatewayResult.mockResolvedValue(true)
})

describe('PaymentService.getMethods', () => {
  it('luôn nhận COD; VNPay bật (cổng giả lập khi chưa cấu hình)', () => {
    expect(PaymentService.getMethods()).toEqual([
      { method: 'cod', enabled: true, sandbox: false },
      { method: 'vnpay', enabled: true, sandbox: true }
    ])
  })
})

describe('PaymentService.handleReturn', () => {
  it('thanh toán thành công: ghi nhận giao dịch và chuyển đơn sang đã thanh toán', async () => {
    const transaction = makeTransaction()
    repo.findByCode.mockResolvedValue(transaction)
    repo.findById.mockResolvedValue(
      makeTransaction({ status: 'success', order: makeOrder({ paymentStatus: 'paid', paidAt: new Date() }) })
    )

    const result = await PaymentService.handleReturn(gatewayResult(transaction, true))

    expect(repo.findByCode).toHaveBeenCalledWith('TT7K3M9QX2')
    expect(repo.applyGatewayResult).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({ status: 'success', responseCode: '00', bankCode: 'NCB', note: null }),
      expect.any(Function)
    )
    const buildOrderChange = repo.applyGatewayResult.mock.calls[0][2]!
    expect(buildOrderChange(makeOrder())).toEqual({ change: { paymentStatus: 'paid', paidAt: expect.any(Date) } })
    expect(result.transaction).toMatchObject({ status: 'success', message: 'Thanh toán thành công' })
    expect(result.order).toMatchObject({ paymentStatus: 'paid', canPay: false })
  })

  it('khách huỷ ở cổng thanh toán: giao dịch thất bại, đơn vẫn chưa thanh toán', async () => {
    const transaction = makeTransaction()
    repo.findByCode.mockResolvedValue(transaction)
    repo.findById.mockResolvedValue(makeTransaction({ status: 'failed', responseCode: '24' }))

    const result = await PaymentService.handleReturn(gatewayResult(transaction, false))

    expect(repo.applyGatewayResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'transaction-1' }),
      expect.objectContaining({ status: 'failed', responseCode: '24' }),
      undefined
    )
    expect(result.transaction.message).toBe('Khách hàng huỷ giao dịch')
    expect(result.order.canPay).toBe(true)
  })

  it('khách trả tiền sau khi đơn đã huỷ: đơn chuyển sang chờ hoàn tiền và tạo giao dịch hoàn', async () => {
    const transaction = makeTransaction()
    repo.findByCode.mockResolvedValue(transaction)
    repo.findById.mockResolvedValue(transaction)

    await PaymentService.handleReturn(gatewayResult(transaction, true))

    const buildOrderChange = repo.applyGatewayResult.mock.calls[0][2]!
    expect(buildOrderChange(makeOrder({ status: 'cancelled' }))).toEqual({
      change: { paymentStatus: 'refund_pending', paidAt: expect.any(Date) },
      refund: expect.objectContaining({ type: 'refund', method: 'vnpay', amount: 930000, userId: 'user-1' })
    })
  })

  it('giao dịch đã có kết quả (IPN báo trước) thì không ghi lại', async () => {
    const transaction = makeTransaction({ status: 'success' })
    repo.findByCode.mockResolvedValue(transaction)
    repo.findById.mockResolvedValue(transaction)

    await PaymentService.handleReturn(gatewayResult(makeTransaction(), true))

    expect(repo.applyGatewayResult).not.toHaveBeenCalled()
  })

  it('số tiền không khớp thì ghi giao dịch thất bại', async () => {
    const transaction = makeTransaction()
    repo.findByCode.mockResolvedValue(makeTransaction({ amount: 1000 }))
    repo.findById.mockResolvedValue(transaction)

    await PaymentService.handleReturn(gatewayResult(transaction, true))

    expect(repo.applyGatewayResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'transaction-1' }),
      expect.objectContaining({ status: 'failed', note: 'Số tiền thanh toán không khớp với đơn hàng' }),
      undefined
    )
  })

  it('sai chữ ký thì báo lỗi, không đọc DB', async () => {
    const query = { ...gatewayResult(makeTransaction(), true), vnp_ResponseCode: '24' }

    await expect(PaymentService.handleReturn(query)).rejects.toThrow(BadRequestError)
    expect(repo.findByCode).not.toHaveBeenCalled()
  })

  it('không tìm thấy giao dịch', async () => {
    repo.findByCode.mockResolvedValue(null)

    await expect(PaymentService.handleReturn(gatewayResult(makeTransaction(), true))).rejects.toThrow(NotFoundError)
  })
})

describe('PaymentService.handleIpn', () => {
  it.each([
    ['ghi nhận thành công', makeTransaction(), true, { RspCode: '00', Message: 'Confirm Success' }],
    [
      'đã ghi nhận trước đó',
      makeTransaction({ status: 'success' }),
      true,
      { RspCode: '02', Message: 'Order already confirmed' }
    ],
    ['sai số tiền', makeTransaction({ amount: 1000 }), true, { RspCode: '04', Message: 'Invalid amount' }],
    ['không tìm thấy giao dịch', null, true, { RspCode: '01', Message: 'Order not found' }]
  ])('%s', async (_case, found, applied, expected) => {
    repo.findByCode.mockResolvedValue(found)
    repo.applyGatewayResult.mockResolvedValue(applied)

    await expect(PaymentService.handleIpn(gatewayResult(makeTransaction(), true))).resolves.toEqual(expected)
  })

  it('sai chữ ký trả mã 97', async () => {
    await expect(PaymentService.handleIpn({ vnp_TxnRef: 'TT7K3M9QX2' })).resolves.toEqual({
      RspCode: '97',
      Message: 'Invalid signature'
    })
  })
})

describe('PaymentService.retry', () => {
  it('tạo lượt thanh toán mới đúng tổng tiền đơn và trả link mới', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder())
    repo.createPayment.mockImplementation(async (orderId, data) => makeTransaction({ ...data, orderId }))

    const result = await PaymentService.retry('user-1', 'order-1', '127.0.0.1')

    expect(repo.createPayment).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ userId: 'user-1', method: 'vnpay', amount: 930000, expiresAt: expect.any(Date) })
    )
    expect(result.paymentUrl).toContain('vnp_Amount=93000000')
  })

  it.each([
    ['đơn của người khác', makeOrder({ userId: 'user-2' }), NotFoundError],
    ['đơn không tồn tại', null, NotFoundError],
    ['đơn đã thanh toán', makeOrder({ paymentStatus: 'paid' }), 'đã được thanh toán'],
    ['đơn COD', makeOrder({ paymentMethod: 'cod' }), 'không thanh toán trực tuyến được'],
    ['đơn đã huỷ', makeOrder({ status: 'cancelled' }), 'không thanh toán trực tuyến được']
  ])('từ chối khi %s', async (_case, order, error) => {
    orderRepo.findById.mockResolvedValue(order)

    await expect(PaymentService.retry('user-1', 'order-1', '127.0.0.1')).rejects.toThrow(error)
    expect(repo.createPayment).not.toHaveBeenCalled()
  })
})

describe('PaymentService.listMine', () => {
  it('chỉ lấy giao dịch của chính mình, kèm diễn giải kết quả', async () => {
    repo.findMany.mockResolvedValue([
      [
        makeTransaction({ status: 'success' }),
        makeTransaction({ id: 't-2', status: 'failed', responseCode: '24' }),
        makeTransaction({ id: 't-3', expiresAt: new Date(Date.now() - 60_000) }),
        makeTransaction({ id: 't-4', type: 'refund', expiresAt: null }),
        makeTransaction({ id: 't-5', type: 'refund', status: 'success' })
      ],
      5
    ])

    const result = await PaymentService.listMine('user-1', { limit: 10, offset: 0, type: undefined })

    expect(repo.findMany).toHaveBeenCalledWith({ limit: 10, offset: 0, type: undefined, userId: 'user-1' })
    expect(result.total_count).toBe(5)
    expect(result.entries.map((t) => t.message)).toEqual([
      'Thanh toán thành công',
      'Khách hàng huỷ giao dịch',
      'Đã hết hạn thanh toán',
      'Chờ cửa hàng hoàn tiền',
      'Đã hoàn tiền'
    ])
    expect(result.entries[0].order).toEqual({ id: 'order-1', code: 'DH7K3M9Q', status: 'pending', total: 930000 })
  })
})

describe('PaymentService (admin)', () => {
  const refund = (overrides = {}) =>
    makeTransaction({
      id: 'refund-1',
      code: 'HT7K3M9QX2',
      type: 'refund',
      expiresAt: null,
      user: makeUser(),
      ...overrides
    })

  it('listForAdmin: đổi ngày lọc sang mốc giờ Việt Nam, kèm tài khoản khách', async () => {
    repo.findMany.mockResolvedValue([[makeTransaction({ user: makeUser() })], 1])

    const result = await PaymentService.listForAdmin({ limit: 10, offset: 0, search: 'TT7K', from: '2026-11-20' })

    expect(repo.findMany).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      search: 'TT7K',
      createdFrom: new Date('2026-11-19T17:00:00.000Z'),
      createdBefore: undefined,
      withCustomer: true
    })
    expect(result.entries[0].customer.email).toBe('an.nguyen@gmail.com')
  })

  it('summarize: cộng theo loại và trạng thái', async () => {
    repo.summarize.mockResolvedValue([
      { type: 'payment', status: 'success', count: 3, amount: 2_000_000 },
      { type: 'payment', status: 'failed', count: 2, amount: 500_000 },
      { type: 'payment', status: 'pending', count: 1, amount: 100_000 },
      { type: 'refund', status: 'success', count: 1, amount: 930_000 },
      { type: 'refund', status: 'pending', count: 1, amount: 390_000 }
    ])
    repo.pendingRefunds.mockResolvedValue({ count: 2, amount: 780_000 })

    await expect(PaymentService.summarize({ from: '2026-11-01', to: '2026-11-30' })).resolves.toEqual({
      receivedAmount: 2_000_000,
      receivedCount: 3,
      refundedAmount: 930_000,
      refundedCount: 1,
      pendingRefundAmount: 780_000,
      pendingRefundCount: 2,
      failedCount: 2
    })
    expect(repo.summarize).toHaveBeenCalledWith(
      new Date('2026-10-31T17:00:00.000Z'),
      new Date('2026-11-30T17:00:00.000Z')
    )
  })

  it('completeRefund: ghi mã tham chiếu và hoàn tất yêu cầu hoàn tiền', async () => {
    repo.findByIdWithCustomer
      .mockResolvedValueOnce(refund({ note: 'Khách huỷ đơn đã thanh toán' }))
      .mockResolvedValueOnce(refund({ status: 'success', gatewayTransactionNo: 'FT1' }))
    repo.completeRefund.mockResolvedValue(true)

    const result = await PaymentService.completeRefund('refund-1', { referenceNo: 'FT1', note: null })

    expect(repo.completeRefund).toHaveBeenCalledWith(expect.objectContaining({ id: 'refund-1', orderId: 'order-1' }), {
      completedAt: expect.any(Date),
      gatewayTransactionNo: 'FT1',
      note: 'Khách huỷ đơn đã thanh toán'
    })
    expect(result).toMatchObject({ status: 'success', message: 'Đã hoàn tiền' })
  })

  it.each([
    ['không phải giao dịch hoàn tiền', makeTransaction({ user: makeUser() }), 'không phải giao dịch hoàn tiền'],
    ['đã hoàn trước đó', refund({ status: 'success' }), 'đã được xử lý'],
    ['không tồn tại', null, NotFoundError]
  ])('completeRefund từ chối khi %s', async (_case, found, error) => {
    repo.findByIdWithCustomer.mockResolvedValue(found)

    await expect(PaymentService.completeRefund('refund-1', { referenceNo: null, note: null })).rejects.toThrow(error)
    expect(repo.completeRefund).not.toHaveBeenCalled()
  })

  it('completeRefund báo tải lại khi bên kia vừa xử lý', async () => {
    repo.findByIdWithCustomer.mockResolvedValue(refund())
    repo.completeRefund.mockResolvedValue(false)

    await expect(PaymentService.completeRefund('refund-1', { referenceNo: null, note: null })).rejects.toThrow(
      'vừa được xử lý'
    )
  })
})
