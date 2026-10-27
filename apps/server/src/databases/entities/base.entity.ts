import { Exclude } from 'class-transformer'
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Exclude({ toPlainOnly: true })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @Exclude({ toPlainOnly: true })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null
}
