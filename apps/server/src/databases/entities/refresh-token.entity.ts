import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'

import { BaseEntity } from './base.entity'
import { User } from './user.entity'

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  token: string

  @Index('IDX_refresh_tokens_user_id')
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'timestamptz' })
  expiresAt: Date

  @Column({ type: 'timestamptz' })
  absoluteExpiresAt: Date

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User
}
