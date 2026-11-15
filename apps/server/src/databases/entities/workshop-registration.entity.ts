import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('workshop_registrations')
export class WorkshopRegistration {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column('uuid') workshopId: string
  @Column('uuid') userId: string
  @Column('integer') seats: number
  @Column() status: string
  @Column('timestamptz') createdAt: Date
  @Column('timestamptz') updatedAt: Date
}
