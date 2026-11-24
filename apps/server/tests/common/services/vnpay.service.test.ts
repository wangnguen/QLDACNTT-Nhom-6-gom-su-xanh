import { describe, expect, it } from 'vitest'

import VnpayService, {
  SANDBOX_TMN_CODE,
  describeResponseCode,
  formatVnpayDate,
  parseVnpayDate
} from '@common/services/vnpay.service'

// Môi trường test không cấu hình VNPay nên service chạy ở chế độ cổng giả lập (cùng thuật toán ký với VNPay)

const createdAt = new Date('2026-11-20T03:15:00.000Z')

const paymentUrl = () =>
  VnpayService.createPaymentUrl({
    txnRef: 'TT7K3M9QX2',
    amount: 930000,
    orderInfo: 'Thanh toan don hang DH7K3M9Q',
    ipAddr: '127.0.0.1',
    createdAt,
    expiresAt: new Date(createdAt.getTime() + 15 * 60 * 1000)
  })

const queryOf = (url: string) => Object.fromEntries(new URL(url).searchParams)

describe('formatVnpayDate / parseVnpayDate', () => {
  it('định dạng yyyyMMddHHmmss theo giờ Việt Nam và đọc ngược lại', () => {
    expect(formatVnpayDate(createdAt)).toBe('20261120101500')
    expect(parseVnpayDate('20261120101500')).toEqual(createdAt)
  })

  it('chuỗi sai định dạng thì trả null', () => {
    expect(parseVnpayDate('2026-11-20')).toBeNull()
    expect(parseVnpayDate(undefined)).toBeNull()
  })
})

describe('VnpayService.createPaymentUrl', () => {
  it('ở môi trường chưa cấu hình VNPay thì dùng cổng giả lập', () => {
    expect(VnpayService.isEnabled).toBe(true)
    expect(VnpayService.isSandbox).toBe(true)
  })

  it('gửi số tiền × 100, thời điểm theo giờ Việt Nam, link quay về trang kết quả và chữ ký', () => {
    const url = paymentUrl()
    const query = queryOf(url)

    expect(url.startsWith('http://localhost:5173/api/v1/payments/sandbox?')).toBe(true)
    expect(query).toMatchObject({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: SANDBOX_TMN_CODE,
      vnp_TxnRef: 'TT7K3M9QX2',
      vnp_Amount: '93000000',
      vnp_CurrCode: 'VND',
      vnp_OrderInfo: 'Thanh toan don hang DH7K3M9Q',
      vnp_ReturnUrl: 'http://localhost:5173/payment/result',
      vnp_CreateDate: '20261120101500',
      vnp_ExpireDate: '20261120103000'
    })
    expect(query.vnp_SecureHash).toMatch(/^[0-9a-f]{128}$/)
  })
})

describe('VnpayService.verifyResult (qua cổng giả lập)', () => {
  it('thanh toán thành công: chữ ký hợp lệ, đọc đúng số tiền và mã giao dịch', () => {
    const returnUrl = VnpayService.buildSandboxReturn(queryOf(paymentUrl()), true)!

    expect(returnUrl.startsWith('http://localhost:5173/payment/result?')).toBe(true)
    expect(VnpayService.verifyResult(queryOf(returnUrl))).toMatchObject({
      txnRef: 'TT7K3M9QX2',
      amount: 930000,
      success: true,
      responseCode: '00',
      bankCode: 'NCB',
      transactionNo: expect.stringMatching(/^\d{8}$/),
      payDate: expect.any(Date)
    })
  })

  it('khách huỷ ở cổng thanh toán: mã 24, không có mã giao dịch VNPay', () => {
    const returnUrl = VnpayService.buildSandboxReturn(queryOf(paymentUrl()), false)!

    expect(VnpayService.verifyResult(queryOf(returnUrl))).toMatchObject({
      success: false,
      responseCode: '24',
      transactionNo: null
    })
    expect(describeResponseCode('24')).toBe('Khách hàng huỷ giao dịch')
  })

  it.each([
    ['sửa số tiền', { vnp_Amount: '100' }],
    ['sửa kết quả', { vnp_ResponseCode: '00' }],
    ['sai chữ ký', { vnp_SecureHash: 'a'.repeat(128) }],
    ['thiếu chữ ký', { vnp_SecureHash: undefined }],
    ['tham số lặp (mảng)', { vnp_TxnRef: ['TT1', 'TT2'] }]
  ])('từ chối khi %s', (_case, override) => {
    const query: Record<string, unknown> = {
      ...queryOf(VnpayService.buildSandboxReturn(queryOf(paymentUrl()), false)!),
      ...override
    }
    if ('vnp_SecureHash' in override && override.vnp_SecureHash === undefined) delete query.vnp_SecureHash

    expect(VnpayService.verifyResult(query)).toBeNull()
  })

  it('cổng giả lập không nhận link thanh toán bị sửa', () => {
    const query = { ...queryOf(paymentUrl()), vnp_Amount: '100' }
    expect(VnpayService.buildSandboxReturn(query, true)).toBeNull()
  })
})
