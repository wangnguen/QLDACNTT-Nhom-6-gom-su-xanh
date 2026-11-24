import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Relation } from 'typeorm'

import {
  ORDER_CANCELLED_BY,
  ORDER_STATUS,
  OrderCancelledBy,
  OrderStatus,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PaymentMethod,
  PaymentStatus
} from '@common/constants/order.constant'

import { BaseEntity } from './base.entity'
import { OrderItem } from './order-item.entity'
import { User } from './user.entity'

// Đơn hàng chốt giá, phí giao hàng và địa chỉ tại thời điểm đặt — sản phẩm đổi giá sau đó không ảnh hưởng
@Entity('orders')
@Index('IDX_orders_code', ['code'], { unique: true })
@Check('CHK_orders_amount', '"subtotal" >= 0 AND "shipping_fee" >= 0 AND "total" = "subtotal" + "shipping_fee"')
export class Order extends BaseEntity {
  // Mã đơn hàng đọc cho cửa hàng khi cần hỗ trợ, vd DH7K3M9Q
  @Column({ type: 'varchar', length: 12 })
  code: string

  @Index('IDX_orders_user_id')
  @Column({ type: 'uuid' })
  userId: string

  @Index('IDX_orders_status')
  @Column({ type: 'enum', enum: ORDER_STATUS, default: ORDER_STATUS.PENDING })
  status: OrderStatus

  @Column({ type: 'enum', enum: PAYMENT_METHOD })
  paymentMethod: PaymentMethod

  @Index('IDX_orders_payment_status')
  @Column({ type: 'enum', enum: PAYMENT_STATUS, default: PAYMENT_STATUS.UNPAID })
  paymentStatus: PaymentStatus

  // Tổng tiền hàng (VND)
  @Column({ type: 'integer' })
  subtotal: number

  @Column({ type: 'integer' })
  shippingFee: number

  // subtotal + shippingFee
  @Column({ type: 'integer' })
  total: number

  // Người nhận — mặc định trang client điền sẵn từ hồ sơ, khách có thể sửa
  @Column({ length: 255 })
  recipientName: string

  @Column({ length: 15 })
  recipientPhone: string

  @Column({ length: 255 })
  shippingAddress: string

  @Column({ type: 'text', nullable: true })
  note: string | null

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string | null

  @Column({ type: 'enum', enum: ORDER_CANCELLED_BY, nullable: true })
  cancelledBy: OrderCancelledBy | null

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null

  @OneToMany(() => OrderItem, (item) => item.order)
  items: Relation<OrderItem>[]

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>
}
