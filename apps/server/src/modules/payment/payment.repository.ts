import { TRANSACTION_STATUS, TRANSACTION_TYPE } from '@common/constants'

import { NewTransactionData } from '@modules/order/order.repository'

import { Order } from '@entities/order.entity'
import { PaymentTransaction } from '@entities/payment-transaction.entity'

import AppDataSource from '@databases/data-source'

export type TransactionResultChange = Pick<
  PaymentTransaction,
  'status' | 'gatewayTransactionNo' | 'bankCode' | 'responseCode' | 'completedAt' | 'note'
>

export type OrderPaymentChange = {
  change: Partial<Pick<Order, 'paymentStatus' | 'paidAt'>>
  // Tiền về sau khi đơn đã bị huỷ → tạo luôn yêu cầu hoàn tiền
  refund?: NewTransactionData
}

class PaymentRepository {
  static findByCode(code: string) {
    return this.transactionRepo.findOne({ where: { code }, relations: { order: { items: true } } })
  }

  static findById(id: string) {
    return this.transactionRepo.findOne({ where: { id }, relations: { order: { items: true } } })
  }

  // Lượt thanh toán mới thay cho các lượt cũ còn dang dở của đơn (link cũ không dùng nữa)
  static createPayment(orderId: string, data: NewTransactionData): Promise<PaymentTransaction> {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const repo = manager.getRepository(PaymentTransaction)
      await repo.update(
        { orderId, type: TRANSACTION_TYPE.PAYMENT, status: TRANSACTION_STATUS.PENDING },
        { status: TRANSACTION_STATUS.FAILED, completedAt: new Date(), note: 'Đã tạo lượt thanh toán mới' }
      )
      return repo.save(repo.create({ ...data, orderId }))
    })
  }

  /**
   * Ghi kết quả cổng thanh toán (một transaction DB): chỉ ghi khi giao dịch còn `pending` nên trình duyệt
   * và IPN cùng báo về thì chỉ lần đầu có tác dụng. Trả về false nếu giao dịch đã có kết quả trước đó.
   *
   * Dòng đơn hàng được khoá trước (cùng thứ tự với lúc huỷ đơn) để kết quả thanh toán và thao tác huỷ đơn
   * không chen nhau; `buildOrderChange` nhận đơn đang khoá và quyết định cập nhật gì cho đơn.
   */
  static applyGatewayResult(
    transaction: Pick<PaymentTransaction, 'id' | 'orderId'>,
    change: TransactionResultChange,
    buildOrderChange?: (order: Order) => OrderPaymentChange
  ): Promise<boolean> {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order)
      const order = await orderRepo.findOne({ where: { id: transaction.orderId }, lock: { mode: 'pessimistic_write' } })

      const repo = manager.getRepository(PaymentTransaction)
      const result = await repo.update({ id: transaction.id, status: TRANSACTION_STATUS.PENDING }, change)
      if ((result.affected ?? 0) === 0) return false

      if (order && buildOrderChange) {
        const { change: orderChange, refund } = buildOrderChange(order)
        await orderRepo.update(order.id, orderChange)
        if (refund) await repo.save(repo.create({ ...refund, orderId: order.id }))
      }
      return true
    })
  }

  private static get transactionRepo() {
    return AppDataSource.getDataSource().getRepository(PaymentTransaction)
  }
}

export default PaymentRepository
