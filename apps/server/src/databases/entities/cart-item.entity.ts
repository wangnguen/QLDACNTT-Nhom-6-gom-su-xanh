import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { BaseEntity } from './base.entity'
import { Product } from './product.entity'
import { User } from './user.entity'

// Mỗi dòng giỏ hàng là một sản phẩm của một user — thêm lại sản phẩm đã có thì cộng dồn số lượng
@Entity('cart_items')
@Index('IDX_cart_items_user_id_product_id', ['userId', 'productId'], { unique: true })
@Check('CHK_cart_items_quantity', '"quantity" > 0')
export class CartItem extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string

  @Index('IDX_cart_items_product_id')
  @Column({ type: 'uuid' })
  productId: string

  @Column({ type: 'integer' })
  quantity: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>
}
