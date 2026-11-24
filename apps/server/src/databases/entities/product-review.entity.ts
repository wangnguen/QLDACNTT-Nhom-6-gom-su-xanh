import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { BaseEntity } from './base.entity'
import { Order } from './order.entity'
import { Product } from './product.entity'
import { User } from './user.entity'

// Đánh giá của khách đã mua và nhận hàng — mỗi tài khoản một đánh giá cho mỗi sản phẩm (sửa được)
@Entity('product_reviews')
@Index('IDX_product_reviews_product_id_user_id', ['productId', 'userId'], {
  unique: true,
  where: '"deleted_at" IS NULL'
})
@Check('CHK_product_reviews_rating', '"rating" BETWEEN 1 AND 5')
export class ProductReview extends BaseEntity {
  @Index('IDX_product_reviews_product_id')
  @Column({ type: 'uuid' })
  productId: string

  @Index('IDX_product_reviews_user_id')
  @Column({ type: 'uuid' })
  userId: string

  // Đơn đã giao có sản phẩm này — bằng chứng khách đã mua
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null

  // Số sao 1–5
  @Column({ type: 'smallint' })
  rating: number

  @Column({ type: 'text', nullable: true })
  comment: string | null

  // Cửa hàng ẩn đánh giá vi phạm (US-25)
  @Column({ type: 'boolean', default: false })
  isHidden: boolean

  // Phản hồi của cửa hàng (US-25)
  @Column({ type: 'text', nullable: true })
  adminReply: string | null

  @Column({ type: 'timestamptz', nullable: true })
  repliedAt: Date | null

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>

  @ManyToOne(() => Order, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order> | null
}
