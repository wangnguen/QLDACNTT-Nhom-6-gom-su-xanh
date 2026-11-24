import {
  ORDER_NOT_FOUND_MESSAGE,
  PAYMENT_EXPIRE_MINUTES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  TRANSACTION_NOT_FOUND_MESSAGE,
  TRANSACTION_STATUS
} from '@common/constants'
import { BadRequestError, NotFoundError } from '@common/errors'
import { VnpayService } from '@common/services'
import { VnpayResult } from '@common/services/vnpay.service'
import { PaymentMethodOption, PaymentResult } from '@common/types'
import { generateCode } from '@common/utils/random'

import { canPayOnline, toOrderDetail } from '@modules/order/order.mapper'
import OrderRepository, { NewTransactionData } from '@modules/order/order.repository'

import { Order } from '@entities/order.entity'
import { PaymentTransaction } from '@entities/payment-transaction.entity'

import { toTransactionItem } from './payment.mapper'
import PaymentRepository, { OrderPaymentChange, TransactionResultChange } from './payment.repository'

// Mã giao dịch: TT + 8 ký tự, vd TT7K3M9QX2 (dùng làm vnp_TxnRef)
const TRANSACTION_CODE_PREFIX = 'TT'

export const ONLINE_PAYMENT_DISABLED_MESSAGE =
  'Hiện chưa nhận thanh toán trực tuyến, vui lòng chọn thanh toán khi nhận hàng'

// Phản hồi IPN theo đặc tả VNPay
export type IpnResponse = { RspCode: string; Message: string }

class PaymentService {
  // US-14: Các phương thức thanh toán trang đặt hàng được hiển thị
  static getMethods(): PaymentMethodOption[] {
    return [
      { method: PAYMENT_METHOD.COD, enabled: true, sandbox: false },
      { method: PAYMENT_METHOD.VNPAY, enabled: VnpayService.isEnabled, sandbox: VnpayService.isSandbox }
    ]
  }

  // Dữ liệu giao dịch thanh toán trực tuyến cho một đơn (link hết hạn sau PAYMENT_EXPIRE_MINUTES phút)
  static newOnlinePayment(userId: string, amount: number, now = new Date()): NewTransactionData {
    if (!VnpayService.isEnabled) throw new BadRequestError(ONLINE_PAYMENT_DISABLED_MESSAGE)
    return {
      code: generateCode(TRANSACTION_CODE_PREFIX, 8),
      userId,
      method: PAYMENT_METHOD.VNPAY,
      amount,
      expiresAt: new Date(now.getTime() + PAYMENT_EXPIRE_MINUTES * 60 * 1000)
    }
  }

  static buildPaymentUrl(transaction: PaymentTransaction, order: Pick<Order, 'code'>, ipAddr: string): string {
    return VnpayService.createPaymentUrl({
      txnRef: transaction.code,
      amount: transaction.amount,
      // VNPay khuyến nghị nội dung không dấu
      orderInfo: `Thanh toan don hang ${order.code}`,
      ipAddr,
      createdAt: transaction.createdAt,
      expiresAt: transaction.expiresAt ?? new Date(transaction.createdAt.getTime() + PAYMENT_EXPIRE_MINUTES * 60_000)
    })
  }

  // US-14: Thanh toán lại đơn VNPay chưa trả tiền (link cũ hết hạn, khách huỷ ở cổng thanh toán...)
  static async retry(userId: string, orderId: string, ipAddr: string): Promise<{ paymentUrl: string }> {
    const order = await OrderRepository.findById(orderId)
    // Đơn của người khác cũng báo không tìm thấy để không lộ thông tin
    if (!order || order.userId !== userId) throw new NotFoundError(ORDER_NOT_FOUND_MESSAGE)
    if (!canPayOnline(order)) {
      throw new BadRequestError(
        order.paymentStatus === PAYMENT_STATUS.UNPAID
          ? 'Đơn hàng này không thanh toán trực tuyến được'
          : 'Đơn hàng đã được thanh toán'
      )
    }

    const transaction = await PaymentRepository.createPayment(order.id, this.newOnlinePayment(userId, order.total))
    return { paymentUrl: this.buildPaymentUrl(transaction, order, ipAddr) }
  }

  // US-14: Trang kết quả thanh toán — trình duyệt của khách quay về từ cổng thanh toán
  static async handleReturn(query: Record<string, unknown>): Promise<PaymentResult> {
    const result = VnpayService.verifyResult(query)
    if (!result) throw new BadRequestError('Kết quả thanh toán không hợp lệ')

    const transaction = await PaymentRepository.findByCode(result.txnRef)
    if (!transaction) throw new NotFoundError(TRANSACTION_NOT_FOUND_MESSAGE)

    await this.applyResult(transaction, result)

    const updated = await PaymentRepository.findById(transaction.id)
    return { transaction: toTransactionItem(updated!), order: toOrderDetail(updated!.order) }
  }

  // US-14: IPN — VNPay gọi thẳng server báo kết quả (cần URL public); trả mã theo đặc tả VNPay
  static async handleIpn(query: Record<string, unknown>): Promise<IpnResponse> {
    const result = VnpayService.verifyResult(query)
    if (!result) return { RspCode: '97', Message: 'Invalid signature' }

    const transaction = await PaymentRepository.findByCode(result.txnRef)
    if (!transaction) return { RspCode: '01', Message: 'Order not found' }
    if (transaction.amount !== result.amount) return { RspCode: '04', Message: 'Invalid amount' }

    const applied = await this.applyResult(transaction, result)
    return applied
      ? { RspCode: '00', Message: 'Confirm Success' }
      : { RspCode: '02', Message: 'Order already confirmed' }
  }

  // Ghi kết quả một lần duy nhất; thanh toán thành công thì đơn chuyển sang "đã thanh toán"
  private static async applyResult(transaction: PaymentTransaction, result: VnpayResult): Promise<boolean> {
    if (transaction.status !== TRANSACTION_STATUS.PENDING) return false

    const amountMatches = result.amount === transaction.amount
    const success = result.success && amountMatches
    const completedAt = result.payDate ?? new Date()

    const change: TransactionResultChange = {
      status: success ? TRANSACTION_STATUS.SUCCESS : TRANSACTION_STATUS.FAILED,
      gatewayTransactionNo: result.transactionNo,
      bankCode: result.bankCode,
      responseCode: result.responseCode,
      completedAt,
      note: amountMatches ? null : 'Số tiền thanh toán không khớp với đơn hàng'
    }

    const orderChange: OrderPaymentChange | undefined = success
      ? { orderId: transaction.orderId, change: { paymentStatus: PAYMENT_STATUS.PAID, paidAt: completedAt } }
      : undefined

    return PaymentRepository.applyGatewayResult(transaction.id, change, orderChange)
  }
}

export default PaymentService
