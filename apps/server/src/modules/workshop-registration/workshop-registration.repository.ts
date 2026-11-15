import { Brackets, In, Not } from 'typeorm'

import { REGISTRATION_STATUS, RegistrationStatus, SEAT_HOLDING_STATUSES } from '@common/constants'

import { WorkshopRegistration } from '@entities/workshop-registration.entity'
import { Workshop } from '@entities/workshop.entity'

import AppDataSource from '@databases/data-source'

export type NewRegistrationData = Pick<
  WorkshopRegistration,
  | 'code'
  | 'workshopId'
  | 'userId'
  | 'seats'
  | 'unitPrice'
  | 'totalPrice'
  | 'contactName'
  | 'contactPhone'
  | 'contactEmail'
  | 'note'
>

export type RegistrationFilter = {
  userId?: string
  workshopId?: string
  status?: RegistrationStatus
  // Mã đăng ký, tên, số điện thoại hoặc email người liên hệ
  search?: string
  limit: number
  offset: number
}

export type StatusChange = Pick<WorkshopRegistration, 'status'> &
  Partial<Pick<WorkshopRegistration, 'cancelReason' | 'cancelledBy' | 'cancelledAt'>>

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

// Trạng thái của lớp đọc ra khi đang giữ khoá: không ai khác đăng ký chen vào được cho tới khi xong
export type SeatLockState = {
  workshop: Workshop | null
  bookedSeats: number
  // Tài khoản này đã có đăng ký chưa huỷ trong lớp
  alreadyRegistered: boolean
}

class WorkshopRegistrationRepository {
  // Tổng số chỗ đang được giữ của từng lớp (lớp chưa có đăng ký nào không có trong Map)
  static async countBookedSeats(workshopIds: string[]): Promise<Map<string, number>> {
    if (workshopIds.length === 0) return new Map()

    const rows = await this.registrationRepo
      .createQueryBuilder('registration')
      .select('registration.workshopId', 'workshopId')
      .addSelect('SUM(registration.seats)::int', 'seats')
      .where('registration.workshopId IN (:...workshopIds)', { workshopIds })
      .andWhere('registration.status IN (:...statuses)', { statuses: SEAT_HOLDING_STATUSES })
      .groupBy('registration.workshopId')
      .getRawMany<{ workshopId: string; seats: number }>()

    return new Map(rows.map((row) => [row.workshopId, row.seats]))
  }

  // Số lượt đăng ký của lớp, tính cả lượt đã huỷ (để chặn xoá lớp đã có người đăng ký)
  static countByWorkshop(workshopId: string) {
    return this.registrationRepo.count({ where: { workshopId } })
  }

  static findById(id: string) {
    return this.registrationRepo.findOne({ where: { id }, relations: { workshop: true } })
  }

  // Mới đăng ký lên trước
  static findMany(filter: RegistrationFilter): Promise<[WorkshopRegistration[], number]> {
    const query = this.registrationRepo
      .createQueryBuilder('registration')
      .innerJoinAndSelect('registration.workshop', 'workshop')

    if (filter.userId) query.andWhere('registration.userId = :userId', { userId: filter.userId })
    if (filter.workshopId) query.andWhere('registration.workshopId = :workshopId', { workshopId: filter.workshopId })
    if (filter.status) query.andWhere('registration.status = :status', { status: filter.status })
    if (filter.search) {
      const keyword = `%${escapeLike(filter.search)}%`
      query.andWhere(
        new Brackets((where) =>
          where
            .where('registration.code ILIKE :keyword', { keyword })
            .orWhere('registration.contactName ILIKE :keyword')
            .orWhere('registration.contactPhone LIKE :keyword')
            .orWhere('registration.contactEmail ILIKE :keyword')
        )
      )
    }

    return query
      .orderBy('registration.createdAt', 'DESC')
      .addOrderBy('registration.id', 'ASC')
      .skip(filter.offset)
      .take(filter.limit)
      .getManyAndCount()
  }

  /**
   * Đổi trạng thái chỉ khi đăng ký vẫn đang ở một trong `fromStatuses` (một câu UPDATE có điều kiện):
   * khách huỷ đúng lúc cửa hàng check-in thì chỉ một bên thành công. Trả về false nếu trạng thái đã đổi.
   */
  static async changeStatus(id: string, fromStatuses: RegistrationStatus[], change: StatusChange): Promise<boolean> {
    const result = await this.registrationRepo.update({ id, status: In(fromStatuses) }, change)
    return (result.affected ?? 0) > 0
  }

  /**
   * Tạo đăng ký trong một transaction có khoá dòng lớp (SELECT ... FOR UPDATE): hai người đăng ký cùng lúc
   * sẽ lần lượt được xử lý nên không bao giờ vượt số chỗ. `build` kiểm tra nghiệp vụ (ném lỗi nếu không hợp lệ)
   * rồi trả về dữ liệu cần lưu.
   */
  static createWithSeatLock(
    workshopId: string,
    userId: string,
    build: (state: SeatLockState) => NewRegistrationData
  ): Promise<WorkshopRegistration> {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const workshop = await manager
        .getRepository(Workshop)
        .findOne({ where: { id: workshopId }, lock: { mode: 'pessimistic_write' } })

      const registrationRepo = manager.getRepository(WorkshopRegistration)
      const [booked, existing] = workshop
        ? await Promise.all([
            registrationRepo.sum('seats', { workshopId, status: In(SEAT_HOLDING_STATUSES) }),
            registrationRepo.exists({ where: { workshopId, userId, status: Not(REGISTRATION_STATUS.CANCELLED) } })
          ])
        : [0, false]

      const data = build({ workshop, bookedSeats: booked ?? 0, alreadyRegistered: existing })
      const registration = await registrationRepo.save(registrationRepo.create(data))
      return registrationRepo.findOneOrFail({ where: { id: registration.id }, relations: { workshop: true } })
    })
  }

  private static get registrationRepo() {
    return AppDataSource.getDataSource().getRepository(WorkshopRegistration)
  }
}

export default WorkshopRegistrationRepository
