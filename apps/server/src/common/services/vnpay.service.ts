import { createHmac, randomInt } from 'crypto'

import env from '@common/config/env'
import { safeEqual } from '@common/utils/random'

const VNPAY_VERSION = '2.1.0'
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

// Cổng thanh toán giả lập của server — dùng khi chưa cấu hình VNPay (không bao giờ bật ở production)
export const SANDBOX_TMN_CODE = 'GSXSANDBX'
export const SANDBOX_PATH = '/api/v1/payments/sandbox'

export const VNPAY_SUCCESS_CODE = '00'

// Ý nghĩa các mã vnp_ResponseCode hay gặp (tài liệu VNPay)
const RESPONSE_MESSAGES: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '07': 'Giao dịch bị nghi ngờ gian lận',
  '09': 'Thẻ/tài khoản chưa đăng ký Internet Banking',
  '10': 'Xác thực thông tin thẻ/tài khoản sai quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán',
  '12': 'Thẻ/tài khoản bị khoá',
  '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
  '24': 'Khách hàng huỷ giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định'
}

export const describeResponseCode = (code: string | null): string =>
  (code && RESPONSE_MESSAGES[code]) || 'Giao dịch không thành công'

type VnpayConfig = {
  tmnCode: string
  hashSecret: string
  payUrl: string
  returnUrl: string
  sandbox: boolean
}

export type CreatePaymentUrlParams = {
  // Mã giao dịch của cửa hàng, duy nhất (vnp_TxnRef)
  txnRef: string
  // Số tiền (VND)
  amount: number
  orderInfo: string
  ipAddr: string
  createdAt: Date
  expiresAt: Date
}

export type VnpayResult = {
  txnRef: string
  // Số tiền (VND) cổng thanh toán xác nhận
  amount: number
  success: boolean
  responseCode: string
  transactionNo: string | null
  bankCode: string | null
  payDate: Date | null
}

// yyyyMMddHHmmss theo giờ Việt Nam (định dạng VNPay yêu cầu)
export const formatVnpayDate = (date: Date): string =>
  new Date(date.getTime() + VN_OFFSET_MS).toISOString().replace(/[-:T]/g, '').slice(0, 14)

export const parseVnpayDate = (value: string | undefined): Date | null => {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
  if (!match) return null
  const [, y, m, d, h, mi, s] = match
  const date = new Date(`${y}-${m}-${d}T${h}:${mi}:${s}+07:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

// Chuỗi ký theo đúng cách thư viện mẫu của VNPay: key sắp xếp tăng dần, value encodeURIComponent với dấu cách là '+'
const toSignData = (params: Record<string, string>): string =>
  Object.keys(params)
    .filter((key) => params[key] !== '')
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`)
    .join('&')

const sign = (params: Record<string, string>, secret: string): string =>
  createHmac('sha512', secret)
    .update(Buffer.from(toSignData(params), 'utf-8'))
    .digest('hex')

// Chỉ lấy các tham số vnp_* dạng chuỗi (query lặp key sẽ ra mảng — coi như không hợp lệ)
const pickVnpParams = (query: Record<string, unknown>): Record<string, string> | null => {
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith('vnp_')) continue
    if (typeof value !== 'string') return null
    params[key] = value
  }
  return params
}

class VnpayService {
  private static cachedConfig: VnpayConfig | null | undefined

  private static get config(): VnpayConfig | null {
    if (this.cachedConfig !== undefined) return this.cachedConfig

    const clientUrl = env.CLIENT_URL.replace(/\/$/, '')
    const returnUrl = env.VNPAY_RETURN_URL ?? `${clientUrl}/payment/result`

    if (env.VNPAY_TMN_CODE && env.VNPAY_HASH_SECRET) {
      this.cachedConfig = {
        tmnCode: env.VNPAY_TMN_CODE,
        hashSecret: env.VNPAY_HASH_SECRET,
        payUrl: env.VNPAY_URL,
        returnUrl,
        sandbox: false
      }
    } else if (env.NODE_ENV !== 'production') {
      // Trang client gọi API qua proxy /api nên cổng giả lập mở được bằng chính CLIENT_URL
      this.cachedConfig = {
        tmnCode: SANDBOX_TMN_CODE,
        hashSecret: createHmac('sha256', env.AUTH_TOKEN_HASH_SECRET).update('vnpay-sandbox').digest('hex'),
        payUrl: `${clientUrl}${SANDBOX_PATH}`,
        returnUrl,
        sandbox: true
      }
    } else {
      this.cachedConfig = null
    }
    return this.cachedConfig
  }

  // Có nhận thanh toán trực tuyến không (production chưa cấu hình VNPay thì không)
  static get isEnabled(): boolean {
    return this.config !== null
  }

  static get isSandbox(): boolean {
    return this.config?.sandbox ?? false
  }

  static createPaymentUrl({ txnRef, amount, orderInfo, ipAddr, createdAt, expiresAt }: CreatePaymentUrlParams): string {
    const config = this.requireConfig()
    const params: Record<string, string> = {
      vnp_Version: VNPAY_VERSION,
      vnp_Command: 'pay',
      vnp_TmnCode: config.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      // VNPay tính tiền theo đơn vị 1/100 đồng
      vnp_Amount: String(amount * 100),
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVnpayDate(createdAt),
      vnp_ExpireDate: formatVnpayDate(expiresAt)
    }
    return `${config.payUrl}?${toSignData(params)}&vnp_SecureHash=${sign(params, config.hashSecret)}`
  }

  /**
   * Kiểm tra chữ ký kết quả VNPay gửi về (qua trình duyệt của khách hoặc IPN).
   * Trả về null nếu chữ ký sai hoặc thiếu tham số — không được tin dữ liệu đó.
   */
  static verifyResult(query: Record<string, unknown>): VnpayResult | null {
    const config = this.config
    const params = pickVnpParams(query)
    if (!config || !params) return null

    const { vnp_SecureHash: secureHash, ...signed } = params
    delete signed.vnp_SecureHashType
    if (!secureHash || !safeEqual(secureHash.toLowerCase(), sign(signed, config.hashSecret))) return null
    if (signed.vnp_TmnCode !== config.tmnCode || !signed.vnp_TxnRef || !/^\d+$/.test(signed.vnp_Amount ?? '')) {
      return null
    }

    const responseCode = signed.vnp_ResponseCode ?? ''
    // vnp_TransactionStatus = trạng thái tại VNPay; IPN luôn có, một số phiên bản cũ của return URL không có
    const transactionStatus = signed.vnp_TransactionStatus ?? responseCode
    return {
      txnRef: signed.vnp_TxnRef,
      amount: Number(signed.vnp_Amount) / 100,
      success: responseCode === VNPAY_SUCCESS_CODE && transactionStatus === VNPAY_SUCCESS_CODE,
      responseCode,
      transactionNo: signed.vnp_TransactionNo && signed.vnp_TransactionNo !== '0' ? signed.vnp_TransactionNo : null,
      bankCode: signed.vnp_BankCode || null,
      payDate: parseVnpayDate(signed.vnp_PayDate)
    }
  }

  /**
   * Cổng giả lập: kiểm tra yêu cầu thanh toán do chính server ký, rồi tạo link quay về trang kết quả
   * giống hệt VNPay (thành công hoặc khách huỷ). Trả về null nếu không ở chế độ giả lập hoặc link bị sửa.
   */
  static buildSandboxReturn(query: Record<string, unknown>, success: boolean): string | null {
    const config = this.config
    const params = pickVnpParams(query)
    if (!config?.sandbox || !params) return null

    const { vnp_SecureHash: secureHash, ...request } = params
    if (!secureHash || !safeEqual(secureHash.toLowerCase(), sign(request, config.hashSecret))) return null

    const result: Record<string, string> = {
      vnp_TmnCode: config.tmnCode,
      vnp_TxnRef: request.vnp_TxnRef,
      vnp_Amount: request.vnp_Amount,
      vnp_OrderInfo: request.vnp_OrderInfo,
      vnp_BankCode: success ? 'NCB' : 'VNPAY',
      vnp_CardType: 'ATM',
      vnp_PayDate: formatVnpayDate(new Date()),
      vnp_ResponseCode: success ? VNPAY_SUCCESS_CODE : '24',
      vnp_TransactionStatus: success ? VNPAY_SUCCESS_CODE : '02',
      vnp_TransactionNo: success ? String(randomInt(10_000_000, 99_999_999)) : '0'
    }
    return `${request.vnp_ReturnUrl}?${toSignData(result)}&vnp_SecureHash=${sign(result, config.hashSecret)}`
  }

  private static requireConfig(): VnpayConfig {
    const config = this.config
    if (!config) throw new Error('VNPay chưa được cấu hình')
    return config
  }
}

export default VnpayService
