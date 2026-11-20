import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'

import UserRepository from '@modules/user/user.repository'
import WorkshopRegistrationRepository, {
  NewRegistrationData,
  SeatLockState
} from '@modules/workshop-registration/workshop-registration.repository'
import WorkshopRegistrationService from '@modules/workshop-registration/workshop-registration.service'

import type { WorkshopRegistration } from '@entities/workshop-registration.entity'

import { makeRegistration, makeUser, makeWorkshop } from '../../helpers/factories'

vi.mock('@modules/workshop-registration/workshop-registration.repository', () => ({
  default: {
    createWithSeatLock: vi.fn(),
    findMany: vi.fn(),
    findById: vi.fn(),
    changeStatus: vi.fn(),
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
  repo.changeStatus.mockResolvedValue(true)
})

const inHours = (hours: number) => new Date(Date.now() + hours * HOUR_MS)
const workshopStartingIn = (hours: number) => makeWorkshop({ startsAt: inHours(hours), endsAt: inHours(hours + 2) })

// findById trả đăng ký ban đầu, lần gọi sau (sau khi đổi trạng thái) trả bản đã cập nhật
const mockFound = (registration: WorkshopRegistration, updated: Partial<WorkshopRegistration> = {}) => {
  repo.findById.mockResolvedValueOnce(registration).mockResolvedValueOnce({ ...registration, ...updated })
}

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

describe('WorkshopRegistrationService.listMine', () => {
  it('chỉ lấy đăng ký của chính mình, kèm quyền tự huỷ', async () => {
    repo.findMany.mockResolvedValue([
      [
        makeRegistration({ status: 'pending' }),
        makeRegistration({ id: 'r-2', status: 'confirmed', workshop: workshopStartingIn(12) }),
        makeRegistration({ id: 'r-3', status: 'cancelled' })
      ],
      3
    ])

    const result = await WorkshopRegistrationService.listMine('user-1', { limit: 10, offset: 0 })

    expect(repo.findMany).toHaveBeenCalledWith({ limit: 10, offset: 0, userId: 'user-1' })
    expect(result.total_count).toBe(3)
    // Lớp còn 7 ngày: huỷ được; còn 12 tiếng: quá hạn tự huỷ; đã huỷ: không huỷ nữa
    expect(result.entries.map((r) => r.canCancel)).toEqual([true, false, false])
  })
})

describe('WorkshopRegistrationService.cancelByUser', () => {
  it('huỷ đăng ký của mình, ghi lý do và người huỷ', async () => {
    mockFound(makeRegistration({ status: 'confirmed' }), { status: 'cancelled', cancelledBy: 'user' })

    const result = await WorkshopRegistrationService.cancelByUser('user-1', 'registration-1', { reason: 'Bận' })

    expect(repo.changeStatus).toHaveBeenCalledWith('registration-1', ['pending', 'confirmed'], {
      status: 'cancelled',
      cancelReason: 'Bận',
      cancelledBy: 'user',
      cancelledAt: expect.any(Date)
    })
    expect(result).toMatchObject({ status: 'cancelled', cancelledBy: 'user', canCancel: false })
  })

  it('đăng ký của người khác báo không tìm thấy', async () => {
    repo.findById.mockResolvedValue(makeRegistration({ userId: 'user-2' }))

    await expect(
      WorkshopRegistrationService.cancelByUser('user-1', 'registration-1', { reason: null })
    ).rejects.toThrow(NotFoundError)
    expect(repo.changeStatus).not.toHaveBeenCalled()
  })

  it.each([
    ['đã huỷ', makeRegistration({ status: 'cancelled' }), 'đã huỷ'],
    ['đã tham gia', makeRegistration({ status: 'attended' }), 'đã tham gia'],
    ['còn dưới 24 tiếng tới giờ học', makeRegistration({ workshop: workshopStartingIn(23) }), 'trước giờ học 24 tiếng']
  ])('không cho huỷ khi %s', async (_case, registration, message) => {
    repo.findById.mockResolvedValue(registration)

    await expect(
      WorkshopRegistrationService.cancelByUser('user-1', 'registration-1', { reason: null })
    ).rejects.toThrow(message)
    expect(repo.changeStatus).not.toHaveBeenCalled()
  })

  it('báo tải lại khi trạng thái vừa bị đổi', async () => {
    repo.findById.mockResolvedValue(makeRegistration())
    repo.changeStatus.mockResolvedValue(false)

    await expect(
      WorkshopRegistrationService.cancelByUser('user-1', 'registration-1', { reason: null })
    ).rejects.toThrow(ConflictError)
  })
})

describe('WorkshopRegistrationService.listForAdmin', () => {
  it('truyền bộ lọc xuống repository', async () => {
    repo.findMany.mockResolvedValue([[makeRegistration()], 1])

    const query = { limit: 20, offset: 0, search: 'WS7K', status: 'pending' as const }
    const result = await WorkshopRegistrationService.listForAdmin(query)

    expect(repo.findMany).toHaveBeenCalledWith(query)
    expect(result.entries[0]).toMatchObject({ code: 'WS7K3M9Q', totalPrice: 700000 })
  })
})

describe('WorkshopRegistrationService.updateStatusByAdmin', () => {
  it('xác nhận đăng ký đang chờ', async () => {
    mockFound(makeRegistration(), { status: 'confirmed' })

    await WorkshopRegistrationService.updateStatusByAdmin('registration-1', { status: 'confirmed' })

    expect(repo.changeStatus).toHaveBeenCalledWith('registration-1', ['pending'], { status: 'confirmed' })
  })

  it('huỷ kèm lý do, ghi người huỷ là cửa hàng', async () => {
    mockFound(makeRegistration({ status: 'confirmed' }), { status: 'cancelled' })

    await WorkshopRegistrationService.updateStatusByAdmin('registration-1', {
      status: 'cancelled',
      cancelReason: 'Lớp tạm hoãn'
    })

    expect(repo.changeStatus).toHaveBeenCalledWith('registration-1', ['pending', 'confirmed'], {
      status: 'cancelled',
      cancelReason: 'Lớp tạm hoãn',
      cancelledBy: 'admin',
      cancelledAt: expect.any(Date)
    })
  })

  it('cửa hàng vẫn huỷ được khi còn dưới 24 tiếng tới giờ học', async () => {
    mockFound(makeRegistration({ workshop: workshopStartingIn(2) }), { status: 'cancelled' })

    await expect(
      WorkshopRegistrationService.updateStatusByAdmin('registration-1', { status: 'cancelled' })
    ).resolves.toBeDefined()
  })

  it('check-in từ 60 phút trước giờ học', async () => {
    mockFound(makeRegistration({ status: 'confirmed', workshop: workshopStartingIn(0.5) }), { status: 'attended' })

    await WorkshopRegistrationService.updateStatusByAdmin('registration-1', { status: 'attended' })

    expect(repo.changeStatus).toHaveBeenCalledWith('registration-1', ['pending', 'confirmed'], { status: 'attended' })
  })

  it('chưa tới giờ check-in thì báo lỗi', async () => {
    repo.findById.mockResolvedValue(makeRegistration({ status: 'confirmed', workshop: workshopStartingIn(2) }))

    await expect(
      WorkshopRegistrationService.updateStatusByAdmin('registration-1', { status: 'attended' })
    ).rejects.toThrow('Chỉ check-in được từ 60 phút trước giờ học')
  })

  it.each([
    ['check-in đăng ký đã huỷ', 'cancelled', 'attended', 'không thể check-in'],
    ['xác nhận lại đăng ký đã xác nhận', 'confirmed', 'confirmed', 'đã được xác nhận trước đó'],
    ['huỷ đăng ký đã tham gia', 'attended', 'cancelled', 'không thể huỷ'],
    ['xác nhận đăng ký đã huỷ', 'cancelled', 'confirmed', 'không thể xác nhận']
  ] as const)('không cho %s', async (_case, current, target, message) => {
    repo.findById.mockResolvedValue(makeRegistration({ status: current, workshop: workshopStartingIn(0.5) }))

    await expect(WorkshopRegistrationService.updateStatusByAdmin('registration-1', { status: target })).rejects.toThrow(
      message
    )
    expect(repo.changeStatus).not.toHaveBeenCalled()
  })

  it('báo 404 khi không tìm thấy', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(WorkshopRegistrationService.updateStatusByAdmin('x', { status: 'confirmed' })).rejects.toThrow(
      NotFoundError
    )
  })
})
