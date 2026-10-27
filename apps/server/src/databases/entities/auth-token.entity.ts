import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'

import { AUTH_TOKEN, AuthTokenType } from '@common/constants/auth.constant'

import { BaseEntity } from './base.entity'
import { User } from './user.entity'

// Mã OTP (xác thực email, quên mật khẩu, đổi email). Chỉ lưu HMAC của mã, không lưu mã gốc.
@Entity('auth_tokens')
@Index('IDX_auth_tokens_user_id_type', ['userId', 'type'])
export class AuthToken extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  token: string

  @Column({ type: 'enum', enum: AUTH_TOKEN })
  type: AuthTokenType

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'timestamptz' })
  expiresAt: Date

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null

  // Số lần nhập sai — vượt OTP_MAX_ATTEMPTS thì mã bị vô hiệu
  @Column({ type: 'int', default: 0 })
  attempts: number

  // Đổi email: địa chỉ mới đang chờ xác thực bằng OTP — chỉ được ghi vào users.email sau khi nhập đúng mã
  @Column({ type: 'varchar', length: 255, nullable: true })
  newEmail: string | null

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User
}
