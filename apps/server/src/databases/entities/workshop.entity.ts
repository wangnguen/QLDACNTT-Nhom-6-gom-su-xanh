import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() name: string
  @Column('text') content: string
  @Column() artisan: string
  @Column('timestamptz') startsAt: Date
  @Column('timestamptz') endsAt: Date
  @Column('integer') capacity: number
  @Column() status: string
  @Column('timestamptz') createdAt: Date
  @Column('timestamptz') updatedAt: Date
}
