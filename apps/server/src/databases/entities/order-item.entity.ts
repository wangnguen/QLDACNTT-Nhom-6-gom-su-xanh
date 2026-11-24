import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { BaseEntity } from './base.entity'
import { Order } from './order.entity'
import { Product } from './product.entity'

// Một dòng sản phẩm trong đơn — lưu lại tên, ảnh, giá lúc đặt để đơn cũ luôn hiển thị đúng
@Entity('order_items')
@Check('CHK_order_items_quantity', '"quantity" > 0')
@Check('CHK_order_items_price', '"unit_price" >= 0 AND "line_total" = "unit_price" * "quantity"')
export class OrderItem extends BaseEntity {
  @Index('IDX_order_items_order_id')
  @Column({ type: 'uuid' })
  orderId: string

  // Sản phẩm bị xoá hẳn khỏi DB thì vẫn giữ dòng đơn (chỉ mất liên kết)
  @Index('IDX_order_items_product_id')
  @Column({ type: 'uuid', nullable: true })
  productId: string | null

  @Column({ length: 255 })
  productName: string

  @Column({ length: 110 })
  productSlug: string

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null

  // Giá mỗi sản phẩm lúc đặt (VND)
  @Column({ type: 'integer' })
  unitPrice: number

  @Column({ type: 'integer' })
  quantity: number

  @Column({ type: 'integer' })
  lineTotal: number

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>

  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product> | null
}
