import { PAYMENT_METHOD, TRANSACTION_STATUS, TRANSACTION_TYPE } from '@common/constants'
import { describeResponseCode } from '@common/services/vnpay.service'
import { TransactionItem } from '@common/types'

import { toOrderRef } from '@modules/order/order.mapper'

import { PaymentTransaction } from '@entities/payment-transaction.entity'

// Diễn giải trạng thái giao dịch cho khách và cửa hàng
const describe = (transaction: PaymentTransaction): string => {
  const isRefund = transaction.type === TRANSACTION_TYPE.REFUND
  switch (transaction.status) {
    case TRANSACTION_STATUS.PENDING:
      return isRefund ? 'Chờ cửa hàng hoàn tiền' : 'Đang chờ thanh toán'
    case TRANSACTION_STATUS.SUCCESS:
      if (isRefund) return 'Đã hoàn tiền'
      return transaction.method === PAYMENT_METHOD.COD ? 'Đã thu tiền khi giao hàng' : 'Thanh toán thành công'
    default:
      return transaction.note ?? describeResponseCode(transaction.responseCode)
  }
}

// `transaction.order` phải được load kèm
export const toTransactionItem = (transaction: PaymentTransaction): TransactionItem => ({
  id: transaction.id,
  code: transaction.code,
  type: transaction.type,
  method: transaction.method,
  amount: transaction.amount,
  status: transaction.status,
  gatewayTransactionNo: transaction.gatewayTransactionNo,
  bankCode: transaction.bankCode,
  responseCode: transaction.responseCode,
  message: describe(transaction),
  note: transaction.note,
  createdAt: transaction.createdAt,
  completedAt: transaction.completedAt,
  order: toOrderRef(transaction.order)
})
