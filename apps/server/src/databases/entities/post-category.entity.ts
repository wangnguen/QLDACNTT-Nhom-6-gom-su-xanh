import { Column, Entity, Index } from 'typeorm'

import { BaseEntity } from './base.entity'

// Danh mục bài viết (tin tức, kiến thức gốm, câu chuyện làng nghề...)
@Entity('post_categories')
// Unique trong các danh mục chưa xoá — xoá mềm xong có thể tạo lại danh mục cùng tên
@Index('IDX_post_categories_slug', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class PostCategory extends BaseEntity {
  @Column({ length: 100 })
  name: string

  // Sinh từ tên; trùng slug nghĩa là trùng tên (không phân biệt hoa thường, dấu)
  @Column({ length: 110 })
  slug: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  // Danh mục bị ẩn không hiện ở trang client (bài viết trong đó cũng ẩn theo)
  @Column({ type: 'boolean', default: true })
  isActive: boolean
}
