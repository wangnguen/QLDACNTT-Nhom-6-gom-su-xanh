import { Exclude } from 'class-transformer'
import { Entity, Column, Index } from 'typeorm'

import { USER_ROLE, UserRole } from '@common/constants'

import { BaseEntity } from './base.entity'

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 255 })
  fullName: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ type: 'varchar', unique: true, length: 15, nullable: true })
  phone: string | null

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', select: false, length: 72, nullable: true })
  password?: string | null

  @Index('IDX_users_role')
  @Column({ type: 'enum', enum: USER_ROLE, default: USER_ROLE.USER })
  role: UserRole

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null
}
