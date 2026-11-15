import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'

import UserRepository from '@modules/user/user.repository'
import WorkshopRegistrationRepository, {
  NewRegistrationData,
  SeatLockState
} from '@modules/workshop-registration/workshop-registration.repository'
import WorkshopRegistrationService from '@modules/workshop-registration/workshop-registration.service'

import type { WorkshopRegistration } from '@entities/workshop-registration.entity'

import { makeUser, makeWorkshop } from '../../helpers/factories'

vi.mock('@modules/workshop-registration/workshop-registration.repository', () => ({
  default: {
    createWithSeatLock: vi.fn(),
    countBookedSeats: vi.fn(),
    countByWorkshop: vi.fn()
  }
}))

vi.mock('@modules/user/user.repository', () => ({
  default: {
    getUserById: vi.fn()
  }
}))

const repo = vi.mocked(WorkshopRegistrationRepository)
const userRepo = vi.mocked(UserRepository)

const HOUR_MS = 60 * 60 * 1000

const body = { workshopId: 'workshop-1', seats: 2, contactName: 'Nguyễn Văn An', contactPhone: '0912345678' }

// Giả lập repository: gọi `build` với trạng thái lớp như đang giữ khoá, rồi "lưu" dữ liệu nó trả về
const mockSeatLock = (state: Partial<SeatLockState> = {}) => {
  const workshop = state.workshop === undefined ? makeWorkshop() : state.workshop
  repo.createWithSeatLock.mockImplementation(async (_workshopId, _userId, build) => {
    const data: NewRegistrationData = build({ workshop, bookedSeats: 0, alreadyRegistered: false, ...state })
    return {
      ...data,
      id: 'registration-1',
      status: 'pending',
      cancelReason: null,
      cancelledBy: null,
      cancelledAt: null,
      createdAt: new Date(),
      workshop: workshop!
    } as WorkshopRegistration
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  userRepo.getUserById.mockResolvedValue(makeUser())
})

describe('WorkshopRegistrationService.register', () => {
  it('giữ chỗ, chốt học phí và tính tổng tiền = số chỗ × học phí', async () => {
    mockSeatLock({ bookedSeats: 5 })

    const result = await WorkshopRegistrationService.register('user-1', { ...body, note: 'Đi cùng bé' })

    expect(repo.createWithSeatLock).toHaveBeenCalledWith('workshop-1', 'user-1', expect.any(Function))
    expect(result).toMatchObject({
      status: 'pending',
      seats: 2,
      unitPrice: 350000,
      totalPrice: 700000,
      contactName: 'Nguyễn Văn An',
      contactEmail: 'an.nguyen@gmail.com',
      note: 'Đi cùng bé',
      workshop: { id: 'workshop-1', slug: 'lop-vuot-gom-co-ban' }
    })
    expect(result.code).toMatch(/^WS[A-Z2-9]{6}$/)
  })

  it('lớp miễn phí có tổng tiền 0', async () => {
    mockSeatLock({ workshop: makeWorkshop({ price: 0 }) })

    await expect(WorkshopRegistrationService.register('user-1', body)).resolves.toMatchObject({ totalPrice: 0 })
  })

  it('được đặt đúng số chỗ cuối cùng', async () => {
    mockSeatLock({ bookedSeats: 10 })

    await expect(WorkshopRegistrationService.register('user-1', body)).resolves.toMatchObject({ seats: 2 })
  })

  it.each([
    ['lớp không tồn tại', { workshop: null }, NotFoundError],
    ['lớp đang ẩn', { workshop: makeWorkshop({ isActive: false }) }, NotFoundError],
    [
      'đã qua hạn đăng ký',
      { workshop: makeWorkshop({ registrationDeadline: new Date(Date.now() - HOUR_MS) }) },
      'hết hạn'
    ],
    [
      'lớp đã bắt đầu',
      { workshop: makeWorkshop({ startsAt: new Date(Date.now() - HOUR_MS), endsAt: new Date(Date.now() + HOUR_MS) }) },
      'hết hạn'
    ],
    ['đã đăng ký lớp này', { alreadyRegistered: true }, ConflictError],
    ['lớp hết chỗ', { bookedSeats: 12 }, 'Lớp đã hết chỗ'],
    ['không đủ chỗ', { bookedSeats: 11 }, 'Lớp chỉ còn 1 chỗ']
  ])('từ chối khi %s', async (_case, state, error) => {
    mockSeatLock(state as Partial<SeatLockState>)

    await expect(WorkshopRegistrationService.register('user-1', body)).rejects.toThrow(error)
  })

  it('báo lỗi khi tài khoản không còn tồn tại', async () => {
    userRepo.getUserById.mockResolvedValue(null)

    await expect(WorkshopRegistrationService.register('user-1', body)).rejects.toThrow(NotFoundError)
    expect(repo.createWithSeatLock).not.toHaveBeenCalled()
  })

  it('thông báo lỗi rõ cho khách khi số chỗ vượt quá', async () => {
    mockSeatLock({ bookedSeats: 11 })
    await expect(WorkshopRegistrationService.register('user-1', body)).rejects.toThrow(BadRequestError)
  })
})
