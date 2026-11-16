import { Check, Column, Entity, Index } from 'typeorm'

import { BaseEntity } from './base.entity'

// Một lớp workshop là một buổi học có giờ bắt đầu/kết thúc và số chỗ cố định
@Entity('workshops')
@Index('IDX_workshops_slug', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
@Check('CHK_workshops_price', '"price" >= 0')
@Check('CHK_workshops_capacity', '"capacity" > 0')
@Check('CHK_workshops_time', '"ends_at" > "starts_at"')
export class Workshop extends BaseEntity {
  @Column({ length: 255 })
  name: string

  // Tự sinh từ tên, trùng thì thêm hậu tố -2, -3... Dùng làm đường dẫn trang chi tiết
  @Column({ length: 110 })
  slug: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  // Nghệ nhân / người hướng dẫn
  @Column({ type: 'varchar', length: 100, nullable: true })
  instructor: string | null

  @Column({ length: 255 })
  location: string

  @Index('IDX_workshops_starts_at')
  @Column({ type: 'timestamptz' })
  startsAt: Date

  @Column({ type: 'timestamptz' })
  endsAt: Date

  // Hạn đăng ký; null = nhận đăng ký tới giờ bắt đầu
  @Column({ type: 'timestamptz', nullable: true })
  registrationDeadline: Date | null

  // Học phí mỗi chỗ (VND), 0 = miễn phí
  @Column({ type: 'integer' })
  price: number

  // Số chỗ tối đa của lớp
  @Column({ type: 'integer' })
  capacity: number

  // Link ảnh do admin dán vào; ảnh đầu tiên là ảnh đại diện
  @Column({ type: 'text', array: true })
  imageUrls: string[]

  // Lớp bị ẩn không xuất hiện ở trang client
  @Column({ type: 'boolean', default: true })
  isActive: boolean
}
