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
  orderId: string
  change: Partial<Pick<Order, 'paymentStatus' | 'paidAt'>>
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
   */
  static applyGatewayResult(
    transactionId: string,
    change: TransactionResultChange,
    orderChange?: OrderPaymentChange
  ): Promise<boolean> {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const repo = manager.getRepository(PaymentTransaction)
      const result = await repo.update({ id: transactionId, status: TRANSACTION_STATUS.PENDING }, change)
      if ((result.affected ?? 0) === 0) return false

      if (orderChange) {
        await manager.getRepository(Order).update(orderChange.orderId, orderChange.change)
      }
      return true
    })
  }

  private static get transactionRepo() {
    return AppDataSource.getDataSource().getRepository(PaymentTransaction)
  }
}

export default PaymentRepository
