import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, NotFoundError } from '@common/errors'
import VnpayService from '@common/services/vnpay.service'

import OrderRepository from '@modules/order/order.repository'
import PaymentRepository from '@modules/payment/payment.repository'
import PaymentService from '@modules/payment/payment.service'

import type { PaymentTransaction } from '@entities/payment-transaction.entity'

import { makeOrder, makeTransaction } from '../../helpers/factories'

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
