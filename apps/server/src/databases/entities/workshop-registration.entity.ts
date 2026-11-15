import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm'

import {
  REGISTRATION_CANCELLED_BY,
  REGISTRATION_STATUS,
  RegistrationCancelledBy,
  RegistrationStatus
} from '@common/constants/workshop.constant'

import { BaseEntity } from './base.entity'
import { User } from './user.entity'
import { Workshop } from './workshop.entity'

// Một lượt đăng ký giữ `seats` chỗ trong lớp cho tới khi bị huỷ
@Entity('workshop_registrations')
@Index('IDX_workshop_registrations_code', ['code'], { unique: true })
// Mỗi tài khoản chỉ có một đăng ký còn hiệu lực trong một lớp; huỷ xong có thể đăng ký lại
@Index('IDX_workshop_registrations_workshop_id_user_id', ['workshopId', 'userId'], {
  unique: true,
  where: `"status" <> 'cancelled' AND "deleted_at" IS NULL`
})
@Check('CHK_workshop_registrations_seats', '"seats" > 0')
@Check('CHK_workshop_registrations_price', '"unit_price" >= 0 AND "total_price" = "unit_price" * "seats"')
export class WorkshopRegistration extends BaseEntity {
  @Column({ type: 'varchar', length: 12 })
  code: string

  @Index('IDX_workshop_registrations_workshop_id')
  @Column({ type: 'uuid' })
  workshopId: string

  @Index('IDX_workshop_registrations_user_id')
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'integer' })
  seats: number

  // Học phí mỗi chỗ lúc đăng ký (VND)
  @Column({ type: 'integer' })
  unitPrice: number

  @Column({ type: 'integer' })
  totalPrice: number

  // Thông tin liên hệ lúc đăng ký (có thể khác hồ sơ tài khoản)
  @Column({ length: 255 })
  contactName: string

  @Column({ length: 15 })
  contactPhone: string

  @Column({ length: 255 })
  contactEmail: string

  @Column({ type: 'text', nullable: true })
  note: string | null

  @Index('IDX_workshop_registrations_status')
  @Column({ type: 'enum', enum: REGISTRATION_STATUS, default: REGISTRATION_STATUS.PENDING })
  status: RegistrationStatus

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string | null

  @Column({ type: 'enum', enum: REGISTRATION_CANCELLED_BY, nullable: true })
  cancelledBy: RegistrationCancelledBy | null

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null

  // Lớp đã có người đăng ký thì không xoá được (chỉ ẩn)
  @ManyToOne(() => Workshop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Relation<Workshop>

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>
}
