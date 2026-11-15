import { WORKSHOP_AVAILABILITY, WORKSHOP_NOT_FOUND_MESSAGE } from '@common/constants'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { WorkshopRegistrationItem } from '@common/types'
import { generateCode } from '@common/utils/random'

import UserRepository from '@modules/user/user.repository'
import { getAvailability } from '@modules/workshop/workshop.mapper'

import { CreateRegistrationBody } from './dto'
import { toRegistrationItem } from './workshop-registration.mapper'
import WorkshopRegistrationRepository from './workshop-registration.repository'

// Mã đăng ký: WS + 6 ký tự, vd WS7K3M9Q
const REGISTRATION_CODE_PREFIX = 'WS'

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
}

export default WorkshopRegistrationService
