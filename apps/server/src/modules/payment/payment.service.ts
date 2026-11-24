import {
  ORDER_NOT_FOUND_MESSAGE,
  ORDER_STATUS,
  PAYMENT_EXPIRE_MINUTES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  TRANSACTION_NOT_FOUND_MESSAGE,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE
} from '@common/constants'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { VnpayService } from '@common/services'
import { VnpayResult } from '@common/services/vnpay.service'
import {
  AdminTransactionItem,
  Paginated,
  PaymentMethodOption,
  PaymentResult,
  TransactionItem,
  TransactionSummary
} from '@common/types'
import { startOfVnDay } from '@common/utils/date'
import { generateCode } from '@common/utils/random'

import { canPayOnline, toOrderDetail } from '@modules/order/order.mapper'
import OrderRepository, { NewTransactionData } from '@modules/order/order.repository'

import { Order } from '@entities/order.entity'
import { PaymentTransaction } from '@entities/payment-transaction.entity'

import { AdminTransactionQuery, CompleteRefundBody, MyTransactionQuery, TransactionSummaryQuery } from './dto'
import { toAdminTransactionItem, toTransactionItem } from './payment.mapper'
import PaymentRepository, { OrderPaymentChange, TransactionResultChange } from './payment.repository'

// Mã giao dịch: TT + 8 ký tự, vd TT7K3M9QX2 (dùng làm vnp_TxnRef); giao dịch hoàn tiền: HT + 8 ký tự
const TRANSACTION_CODE_PREFIX = 'TT'
const REFUND_CODE_PREFIX = 'HT'

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

  // US-19: Đơn COD giao thành công — ghi nhận khoản tiền shipper đã thu
  static newCodPayment(order: Pick<Order, 'userId' | 'total'>): NewTransactionData {
    return {
      code: generateCode(TRANSACTION_CODE_PREFIX, 8),
      userId: order.userId,
      method: PAYMENT_METHOD.COD,
      amount: order.total,
      expiresAt: null
    }
  }

  // US-16: Yêu cầu hoàn tiền cho đơn đã thanh toán bị huỷ — chờ cửa hàng hoàn tiền rồi xác nhận
  static newRefund(order: Pick<Order, 'userId' | 'paymentMethod' | 'total'>, note: string): NewTransactionData {
    return {
      code: generateCode(REFUND_CODE_PREFIX, 8),
      userId: order.userId,
      type: TRANSACTION_TYPE.REFUND,
      method: order.paymentMethod,
      amount: order.total,
      expiresAt: null,
      note
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

  // US-17: Lịch sử giao dịch của tôi — thanh toán và hoàn tiền, mới nhất lên trước
  static async listMine(userId: string, query: MyTransactionQuery): Promise<Paginated<TransactionItem>> {
    const [transactions, total] = await PaymentRepository.findMany({ ...query, userId })
    return {
      limit: query.limit,
      offset: query.offset,
      total_count: total,
      entries: transactions.map((t) => toTransactionItem(t))
    }
  }

  // US-20: Danh sách giao dịch ở trang admin, kèm tài khoản khách
  static async listForAdmin({ from, to, ...query }: AdminTransactionQuery): Promise<Paginated<AdminTransactionItem>> {
    const [transactions, total] = await PaymentRepository.findMany({
      ...query,
      createdFrom: from ? startOfVnDay(from) : undefined,
      createdBefore: to ? startOfVnDay(to, 1) : undefined,
      withCustomer: true
    })
    return {
      limit: query.limit,
      offset: query.offset,
      total_count: total,
      entries: transactions.map((t) => toAdminTransactionItem(t))
    }
  }

  // US-20: Tổng tiền đã nhận / đã hoàn trong khoảng ngày; yêu cầu hoàn đang chờ tính mọi thời điểm
  static async summarize({ from, to }: TransactionSummaryQuery): Promise<TransactionSummary> {
    const [rows, pending] = await Promise.all([
      PaymentRepository.summarize(from ? startOfVnDay(from) : undefined, to ? startOfVnDay(to, 1) : undefined),
      PaymentRepository.pendingRefunds()
    ])
    const pick = (type: string, status: string) => rows.find((row) => row.type === type && row.status === status)
    const received = pick(TRANSACTION_TYPE.PAYMENT, TRANSACTION_STATUS.SUCCESS)
    const refunded = pick(TRANSACTION_TYPE.REFUND, TRANSACTION_STATUS.SUCCESS)
    return {
      receivedAmount: received?.amount ?? 0,
      receivedCount: received?.count ?? 0,
      refundedAmount: refunded?.amount ?? 0,
      refundedCount: refunded?.count ?? 0,
      pendingRefundAmount: pending.amount,
      pendingRefundCount: pending.count,
      failedCount: rows
        .filter((row) => row.status === TRANSACTION_STATUS.FAILED)
        .reduce((sum, row) => sum + row.count, 0)
    }
  }

  // US-20: Cửa hàng xác nhận đã hoàn tiền cho khách (chuyển khoản / hoàn qua VNPay ngoài hệ thống)
  static async completeRefund(id: string, { referenceNo, note }: CompleteRefundBody): Promise<AdminTransactionItem> {
    const transaction = await PaymentRepository.findByIdWithCustomer(id)
    if (!transaction) throw new NotFoundError(TRANSACTION_NOT_FOUND_MESSAGE)
    if (transaction.type !== TRANSACTION_TYPE.REFUND) throw new BadRequestError('Đây không phải giao dịch hoàn tiền')
    if (transaction.status !== TRANSACTION_STATUS.PENDING)
      throw new BadRequestError('Giao dịch hoàn tiền đã được xử lý')

    const completed = await PaymentRepository.completeRefund(transaction, {
      completedAt: new Date(),
      gatewayTransactionNo: referenceNo,
      note: note ?? transaction.note
    })
    if (!completed) throw new ConflictError('Giao dịch vừa được xử lý, vui lòng tải lại trang')

    const updated = await PaymentRepository.findByIdWithCustomer(id)
    return toAdminTransactionItem(updated!)
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

  /**
   * Ghi kết quả một lần duy nhất; thanh toán thành công thì đơn chuyển sang "đã thanh toán".
   * Khách trả tiền ở tab khác sau khi đã huỷ đơn (US-16) thì đơn chuyển sang chờ hoàn tiền.
   */
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

    const buildOrderChange = (order: Order): OrderPaymentChange => {
      if (order.status === ORDER_STATUS.CANCELLED) {
        return {
          change: { paymentStatus: PAYMENT_STATUS.REFUND_PENDING, paidAt: completedAt },
          refund: this.newRefund(order, 'Khách thanh toán sau khi đơn đã huỷ')
        }
      }
      return { change: { paymentStatus: PAYMENT_STATUS.PAID, paidAt: completedAt } }
    }

    return PaymentRepository.applyGatewayResult(transaction, change, success ? buildOrderChange : undefined)
  }
}

export default PaymentService
