import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { BaseEntity } from './base.entity'
import { Category } from './category.entity'

@Entity('products')
@Index('IDX_products_slug', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
@Check('CHK_products_price', '"price" >= 0')
@Check('CHK_products_stock', '"stock" >= 0')
export class Product extends BaseEntity {
  @Column({ length: 255 })
  name: string

  // Tự sinh từ tên, trùng thì thêm hậu tố -2, -3... Dùng làm đường dẫn trang chi tiết
  @Column({ length: 110 })
  slug: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  // Giá bán (VND)
  @Column({ type: 'integer' })
  price: number

  // Số lượng tồn kho
  @Column({ type: 'integer', default: 0 })
  stock: number

  @Column({ type: 'varchar', length: 100, nullable: true })
  material: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  dimensions: string | null

  // Link ảnh do admin dán vào; ảnh đầu tiên là ảnh đại diện
  @Column({ type: 'text', array: true })
  imageUrls: string[]

  // Sản phẩm bị ẩn không xuất hiện ở trang client
  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @Index('IDX_products_category_id')
  @Column({ type: 'uuid' })
  categoryId: string

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>
}
