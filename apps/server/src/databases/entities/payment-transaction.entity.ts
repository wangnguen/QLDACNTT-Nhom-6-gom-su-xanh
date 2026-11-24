import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm'

import {
  PAYMENT_METHOD,
  PaymentMethod,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  TransactionStatus,
  TransactionType
} from '@common/constants/order.constant'

import { BaseEntity } from './base.entity'
import { Order } from './order.entity'
import { User } from './user.entity'

// Mỗi lần khách bấm thanh toán (hoặc cửa hàng hoàn tiền) là một giao dịch — một đơn có thể có nhiều giao dịch
@Entity('payment_transactions')
@Index('IDX_payment_transactions_code', ['code'], { unique: true })
@Check('CHK_payment_transactions_amount', '"amount" > 0')
export class PaymentTransaction extends BaseEntity {
  // Mã giao dịch gửi sang cổng thanh toán (vnp_TxnRef), vd TT7K3M9QX2
  @Column({ type: 'varchar', length: 20 })
  code: string

  @Index('IDX_payment_transactions_order_id')
  @Column({ type: 'uuid' })
  orderId: string

  @Index('IDX_payment_transactions_user_id')
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'enum', enum: TRANSACTION_TYPE, default: TRANSACTION_TYPE.PAYMENT })
  type: TransactionType

  @Column({ type: 'enum', enum: PAYMENT_METHOD })
  method: PaymentMethod

  // Số tiền (VND)
  @Column({ type: 'integer' })
  amount: number

  @Index('IDX_payment_transactions_status')
  @Column({ type: 'enum', enum: TRANSACTION_STATUS, default: TRANSACTION_STATUS.PENDING })
  status: TransactionStatus

  // Mã giao dịch phía cổng thanh toán (vnp_TransactionNo)
  @Column({ type: 'varchar', length: 50, nullable: true })
  gatewayTransactionNo: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  bankCode: string | null

  // Mã kết quả cổng thanh toán trả về (vnp_ResponseCode), '00' = thành công
  @Column({ type: 'varchar', length: 10, nullable: true })
  responseCode: string | null

  // Thời điểm giao dịch kết thúc (thành công hoặc thất bại)
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null

  // Link thanh toán hết hạn lúc này (chỉ giao dịch qua cổng thanh toán)
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>
}
