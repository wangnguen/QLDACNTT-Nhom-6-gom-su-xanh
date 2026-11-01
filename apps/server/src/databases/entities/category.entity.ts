import { Column, Entity, Index, OneToMany, Relation } from 'typeorm'

import { BaseEntity } from './base.entity'
import { Product } from './product.entity'

@Entity('categories')
// Unique trong các danh mục chưa xoá — xoá mềm xong có thể tạo lại danh mục cùng tên
@Index('IDX_categories_slug', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Category extends BaseEntity {
  @Column({ length: 100 })
  name: string

  @Column({ length: 100 })
  slug: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null

  // Danh mục bị ẩn thì mọi sản phẩm trong đó cũng không hiện ở trang client
  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @OneToMany(() => Product, (product) => product.category)
  products: Relation<Product[]>
}
