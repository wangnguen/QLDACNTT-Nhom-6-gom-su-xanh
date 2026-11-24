import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { POST_STATUS, PostStatus } from '@common/constants/blog.constant'

import { BaseEntity } from './base.entity'
import { PostCategory } from './post-category.entity'
import { User } from './user.entity'

// Bài viết tin tức / blog — nội dung là văn bản, đoạn cách nhau bởi dòng trống, dòng bắt đầu bằng "## " là tiêu đề mục
@Entity('posts')
@Index('IDX_posts_slug', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('IDX_posts_status_published_at', ['status', 'publishedAt'])
export class Post extends BaseEntity {
  @Column({ length: 255 })
  title: string

  // Tự sinh từ tiêu đề, trùng thì thêm hậu tố -2, -3... Dùng làm đường dẫn bài viết
  @Column({ length: 110 })
  slug: string

  // Đoạn tóm tắt hiện ở danh sách; để trống thì lấy đầu nội dung
  @Column({ type: 'varchar', length: 500, nullable: true })
  excerpt: string | null

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'text', nullable: true })
  coverImageUrl: string | null

  @Index('IDX_posts_category_id')
  @Column({ type: 'uuid' })
  categoryId: string

  @Column({ type: 'enum', enum: POST_STATUS, default: POST_STATUS.DRAFT })
  status: PostStatus

  // Lúc đăng bài; bản nháp là null
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null

  // Quản trị viên viết bài; tài khoản bị xoá thì bài vẫn còn
  @Column({ type: 'uuid', nullable: true })
  authorId: string | null

  @Column({ type: 'integer', default: 0 })
  viewCount: number

  @ManyToOne(() => PostCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Relation<PostCategory>

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  author: Relation<User> | null
}
