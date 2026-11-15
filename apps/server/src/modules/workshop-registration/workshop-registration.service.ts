import {
  CANCELLABLE_STATUSES,
  CHECK_IN_OPENS_BEFORE_MINUTES,
  REGISTRATION_CANCEL_BEFORE_HOURS,
  REGISTRATION_CANCELLED_BY,
  REGISTRATION_STATUS,
  RegistrationStatus,
  WORKSHOP_AVAILABILITY,
  WORKSHOP_NOT_FOUND_MESSAGE
} from '@common/constants'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { Paginated, WorkshopRegistrationItem } from '@common/types'
import { generateCode } from '@common/utils/random'

import UserRepository from '@modules/user/user.repository'
import { getAvailability } from '@modules/workshop/workshop.mapper'

import { WorkshopRegistration } from '@entities/workshop-registration.entity'

import {
  AdminRegistrationQuery,
  CancelRegistrationBody,
  CreateRegistrationBody,
  MyRegistrationQuery,
  UpdateRegistrationStatusBody
} from './dto'
import { getCancellableUntil, toRegistrationItem } from './workshop-registration.mapper'
import WorkshopRegistrationRepository, { StatusChange } from './workshop-registration.repository'

// Mã đăng ký: WS + 6 ký tự, vd WS7K3M9Q
const REGISTRATION_CODE_PREFIX = 'WS'

export const REGISTRATION_NOT_FOUND_MESSAGE = 'Không tìm thấy đăng ký'

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: 'chờ xác nhận',
  confirmed: 'đã xác nhận',
  attended: 'đã tham gia',
  cancelled: 'đã huỷ'
}

// Admin chuyển sang trạng thái nào thì đăng ký phải đang ở trạng thái nào
const ADMIN_TRANSITIONS: Record<
  UpdateRegistrationStatusBody['status'],
  { from: RegistrationStatus[]; action: string }
> = {
  confirmed: { from: [REGISTRATION_STATUS.PENDING], action: 'xác nhận' },
  attended: { from: [REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.CONFIRMED], action: 'check-in' },
  cancelled: { from: CANCELLABLE_STATUSES, action: 'huỷ' }
}

class WorkshopRegistrationService {
  // US-12: Đăng ký lớp workshop — chờ cửa hàng xác nhận; tổng tiền = số chỗ × học phí lúc đăng ký
  static async register(userId: string, dto: CreateRegistrationBody): Promise<WorkshopRegistrationItem> {
    const user = await UserRepository.getUserById(userId)
    if (!user) throw new NotFoundError('Không tìm thấy tài khoản')

    const registration = await WorkshopRegistrationRepository.createWithSeatLock(
      dto.workshopId,
      userId,
      ({ workshop, bookedSeats, alreadyRegistered }) => {
        if (!workshop || !workshop.isActive) throw new NotFoundError(WORKSHOP_NOT_FOUND_MESSAGE)

        const seatsLeft = Math.max(0, workshop.capacity - bookedSeats)
        const availability = getAvailability(workshop, seatsLeft)
        if (availability === WORKSHOP_AVAILABILITY.CLOSED) throw new BadRequestError('Lớp đã hết hạn đăng ký')
        if (alreadyRegistered) {
          throw new ConflictError('Bạn đã đăng ký lớp này rồi. Xem lại trong mục "Lịch workshop của tôi"')
        }
        if (availability === WORKSHOP_AVAILABILITY.FULL) throw new BadRequestError('Lớp đã hết chỗ')
        if (dto.seats > seatsLeft) throw new BadRequestError(`Lớp chỉ còn ${seatsLeft} chỗ`)

        return {
          code: generateCode(REGISTRATION_CODE_PREFIX),
          workshopId: workshop.id,
          userId,
          seats: dto.seats,
          unitPrice: workshop.price,
          totalPrice: workshop.price * dto.seats,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          contactEmail: user.email,
          note: dto.note ?? null
        }
      }
    )

    return toRegistrationItem(registration)
  }

  // US-13: Lịch workshop của tôi — mới đăng ký lên trước
  static async listMine(userId: string, query: MyRegistrationQuery): Promise<Paginated<WorkshopRegistrationItem>> {
    const [registrations, total] = await WorkshopRegistrationRepository.findMany({ ...query, userId })
    return {
      limit: query.limit,
      offset: query.offset,
      total_count: total,
      entries: registrations.map((r) => toRegistrationItem(r))
    }
  }

  // US-13: Khách tự huỷ — chỉ đăng ký của mình, trước giờ học REGISTRATION_CANCEL_BEFORE_HOURS tiếng; huỷ xong nhả chỗ
  static async cancelByUser(
    userId: string,
    id: string,
    { reason }: CancelRegistrationBody
  ): Promise<WorkshopRegistrationItem> {
    const registration = await WorkshopRegistrationRepository.findById(id)
    // Đăng ký của người khác cũng báo không tìm thấy để không lộ thông tin
    if (!registration || registration.userId !== userId) throw new NotFoundError(REGISTRATION_NOT_FOUND_MESSAGE)

    this.ensureStatus(registration, CANCELLABLE_STATUSES, 'huỷ')
    if (Date.now() >= getCancellableUntil(registration).getTime()) {
      throw new BadRequestError(
        `Chỉ tự huỷ được trước giờ học ${REGISTRATION_CANCEL_BEFORE_HOURS} tiếng. Vui lòng liên hệ cửa hàng để được hỗ trợ`
      )
    }

    return this.changeStatus(registration, CANCELLABLE_STATUSES, {
      status: REGISTRATION_STATUS.CANCELLED,
      cancelReason: reason,
      cancelledBy: REGISTRATION_CANCELLED_BY.USER,
      cancelledAt: new Date()
    })
  }

  // US-13: Danh sách đăng ký ở trang admin
  static async listForAdmin(query: AdminRegistrationQuery): Promise<Paginated<WorkshopRegistrationItem>> {
    const [registrations, total] = await WorkshopRegistrationRepository.findMany(query)
    return {
      limit: query.limit,
      offset: query.offset,
      total_count: total,
      entries: registrations.map((r) => toRegistrationItem(r))
    }
  }

  // US-13: Cửa hàng xác nhận, check-in (từ CHECK_IN_OPENS_BEFORE_MINUTES phút trước giờ học) hoặc huỷ đăng ký
  static async updateStatusByAdmin(
    id: string,
    { status, cancelReason }: UpdateRegistrationStatusBody
  ): Promise<WorkshopRegistrationItem> {
    const registration = await WorkshopRegistrationRepository.findById(id)
    if (!registration) throw new NotFoundError(REGISTRATION_NOT_FOUND_MESSAGE)

    const { from, action } = ADMIN_TRANSITIONS[status]
    this.ensureStatus(registration, from, action)

    if (status === REGISTRATION_STATUS.ATTENDED) {
      const checkInOpensAt = registration.workshop.startsAt.getTime() - CHECK_IN_OPENS_BEFORE_MINUTES * 60 * 1000
      if (Date.now() < checkInOpensAt) {
        throw new BadRequestError(`Chỉ check-in được từ ${CHECK_IN_OPENS_BEFORE_MINUTES} phút trước giờ học`)
      }
    }

    const change: StatusChange =
      status === REGISTRATION_STATUS.CANCELLED
        ? {
            status,
            cancelReason: cancelReason ?? null,
            cancelledBy: REGISTRATION_CANCELLED_BY.ADMIN,
            cancelledAt: new Date()
          }
        : { status }
    return this.changeStatus(registration, from, change)
  }

  private static ensureStatus(registration: WorkshopRegistration, allowed: RegistrationStatus[], action: string) {
    if (allowed.includes(registration.status)) return
    if (registration.status === REGISTRATION_STATUS.CONFIRMED && action === 'xác nhận') {
      throw new BadRequestError('Đăng ký đã được xác nhận trước đó')
    }
    throw new BadRequestError(`Đăng ký đang ở trạng thái "${STATUS_LABEL[registration.status]}", không thể ${action}`)
  }

  // Trạng thái có thể vừa bị bên kia đổi (khách huỷ đúng lúc cửa hàng check-in) → báo tải lại thay vì ghi đè
  private static async changeStatus(
    registration: WorkshopRegistration,
    from: RegistrationStatus[],
    change: StatusChange
  ): Promise<WorkshopRegistrationItem> {
    const changed = await WorkshopRegistrationRepository.changeStatus(registration.id, from, change)
    if (!changed) throw new ConflictError('Trạng thái đăng ký vừa thay đổi, vui lòng tải lại trang')

    const updated = await WorkshopRegistrationRepository.findById(registration.id)
    return toRegistrationItem(updated!)
  }
}

export default WorkshopRegistrationService
