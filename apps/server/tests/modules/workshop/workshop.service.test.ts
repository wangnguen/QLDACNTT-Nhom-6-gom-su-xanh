import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'

import WorkshopRepository from '@modules/workshop/workshop.repository'
import WorkshopService from '@modules/workshop/workshop.service'
import WorkshopRegistrationRepository from '@modules/workshop-registration/workshop-registration.repository'

import { makeWorkshop } from '../../helpers/factories'

vi.mock('@modules/workshop/workshop.repository', () => ({
  default: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findVisibleBySlug: vi.fn(),
    findSlugsWithBase: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn()
  }
}))

vi.mock('@modules/workshop-registration/workshop-registration.repository', () => ({
  default: {
    countBookedSeats: vi.fn(),
    countByWorkshop: vi.fn()
  }
}))

const repo = vi.mocked(WorkshopRepository)
const registrationRepo = vi.mocked(WorkshopRegistrationRepository)

const HOUR_MS = 60 * 60 * 1000
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR_MS)

const createBody = {
  name: 'Lớp vuốt gốm cơ bản',
  location: '12 Bát Tràng',
  startsAt: inHours(48),
  endsAt: inHours(50),
  price: 350000,
  capacity: 12,
  imageUrls: [],
  isActive: true
}

beforeEach(() => {
  vi.resetAllMocks()
  repo.findSlugsWithBase.mockResolvedValue([])
  repo.create.mockImplementation(async (data) => makeWorkshop(data))
  repo.update.mockImplementation(async (id, data) => makeWorkshop({ id, ...data }))
  registrationRepo.countBookedSeats.mockResolvedValue(new Map())
  registrationRepo.countByWorkshop.mockResolvedValue(0)
})

describe('WorkshopService.list', () => {
  it('chỉ lấy lớp khách được thấy, đổi khoảng ngày theo giờ Việt Nam', async () => {
    repo.findMany.mockResolvedValue([[], 0])

    await WorkshopService.list({ limit: 12, offset: 0, sort: 'start_asc', from: '2026-12-01', to: '2026-12-31' })

    expect(repo.findMany).toHaveBeenCalledWith({
      limit: 12,
      offset: 0,
      sort: 'start_asc',
      visibleOnly: true,
      startsFrom: new Date('2026-11-30T17:00:00.000Z'),
      startsBefore: new Date('2026-12-31T17:00:00.000Z')
    })
  })

  it('tính số chỗ còn lại và trạng thái nhận đăng ký của từng lớp', async () => {
    repo.findMany.mockResolvedValue([
      [
        makeWorkshop({ id: 'open', capacity: 12 }),
        makeWorkshop({ id: 'full', capacity: 4 }),
        makeWorkshop({ id: 'closed', registrationDeadline: inHours(-1) })
      ],
      3
    ])
    registrationRepo.countBookedSeats.mockResolvedValue(
      new Map([
        ['open', 5],
        ['full', 4]
      ])
    )

    const { entries } = await WorkshopService.list({ limit: 12, offset: 0, sort: 'start_asc' })

    expect(registrationRepo.countBookedSeats).toHaveBeenCalledWith(['open', 'full', 'closed'])
    expect(entries.map((w) => [w.id, w.bookedSeats, w.seatsLeft, w.availability])).toEqual([
      ['open', 5, 7, 'open'],
      ['full', 4, 0, 'full'],
      ['closed', 0, 12, 'closed']
    ])
  })
})

describe('WorkshopService.getBySlug', () => {
  it('trả về chi tiết kèm số chỗ đã đặt', async () => {
    repo.findVisibleBySlug.mockResolvedValue(makeWorkshop())
    registrationRepo.countBookedSeats.mockResolvedValue(new Map([['workshop-1', 3]]))

    const result = await WorkshopService.getBySlug('lop-vuot-gom-co-ban')

    expect(result).toMatchObject({ bookedSeats: 3, seatsLeft: 9, availability: 'open', imageUrls: expect.any(Array) })
  })

  it('lớp ẩn hoặc không tồn tại trả 404', async () => {
    repo.findVisibleBySlug.mockResolvedValue(null)
    await expect(WorkshopService.getBySlug('abc')).rejects.toThrow(NotFoundError)
  })
})

describe('WorkshopService.listForAdmin', () => {
  it('đổi bộ lọc trạng thái thành isActive và trả về dạng phân trang', async () => {
    repo.findMany.mockResolvedValue([[makeWorkshop()], 1])

    const result = await WorkshopService.listForAdmin({ limit: 10, offset: 0, sort: 'start_asc', status: 'hidden' })

    expect(repo.findMany).toHaveBeenCalledWith({ limit: 10, offset: 0, sort: 'start_asc', isActive: false })
    expect(result).toMatchObject({ limit: 10, offset: 0, total_count: 1 })
    expect(result.entries[0]).not.toHaveProperty('description')
  })
})

describe('WorkshopService.getForAdmin', () => {
  it('chưa đặt hạn đăng ký thì đóng đăng ký lúc bắt đầu', async () => {
    const workshop = makeWorkshop()
    repo.findById.mockResolvedValue(workshop)

    const result = await WorkshopService.getForAdmin('workshop-1')

    expect(result).toMatchObject({
      imageUrl: 'https://example.com/ws-1.jpg',
      registrationDeadline: null,
      registrationClosesAt: workshop.startsAt
    })
  })

  it('báo 404 khi không tìm thấy', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(WorkshopService.getForAdmin('workshop-1')).rejects.toThrow(NotFoundError)
  })
})

describe('WorkshopService.create', () => {
  it('sinh slug từ tên, trùng thì thêm hậu tố', async () => {
    repo.findSlugsWithBase.mockResolvedValue(['lop-vuot-gom-co-ban'])

    await WorkshopService.create(createBody)

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'lop-vuot-gom-co-ban-2' }))
  })

  it.each([
    ['bắt đầu trong quá khứ', { startsAt: inHours(-1), endsAt: inHours(1) }, 'Thời gian bắt đầu phải sau'],
    ['kết thúc trước khi bắt đầu', { endsAt: inHours(47) }, 'Thời gian kết thúc phải sau'],
    ['dài quá 12 tiếng', { endsAt: inHours(61) }, 'tối đa 12 tiếng'],
    ['hạn đăng ký sau giờ bắt đầu', { registrationDeadline: inHours(49) }, 'Hạn đăng ký không được sau']
  ])('từ chối khi %s', async (_case, override, message) => {
    await expect(WorkshopService.create({ ...createBody, ...override })).rejects.toThrow(message)
    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('WorkshopService.update', () => {
  it('đổi tên thì sinh slug mới', async () => {
    repo.findById.mockResolvedValue(makeWorkshop())

    await WorkshopService.update('workshop-1', { name: 'Lớp vẽ men lam' })

    expect(repo.findSlugsWithBase).toHaveBeenCalledWith('lop-ve-men-lam', 'workshop-1')
    expect(repo.update).toHaveBeenCalledWith('workshop-1', { name: 'Lớp vẽ men lam', slug: 'lop-ve-men-lam' })
  })

  it('kiểm tra lịch mới bằng cách ghép với giá trị cũ', async () => {
    const workshop = makeWorkshop()
    repo.findById.mockResolvedValue(workshop)

    // Hạn đăng ký sau giờ bắt đầu hiện tại của lớp
    await expect(
      WorkshopService.update('workshop-1', { registrationDeadline: new Date(workshop.startsAt.getTime() + HOUR_MS) })
    ).rejects.toThrow(BadRequestError)
    // Kết thúc trước giờ bắt đầu hiện tại
    await expect(WorkshopService.update('workshop-1', { endsAt: inHours(1) })).rejects.toThrow(
      'Thời gian kết thúc phải sau'
    )
  })

  it('lớp đã diễn ra vẫn sửa được nội dung và hạn đăng ký, chỉ không dời giờ về quá khứ', async () => {
    repo.findById.mockResolvedValue(makeWorkshop({ startsAt: inHours(-3), endsAt: inHours(-1) }))

    await WorkshopService.update('workshop-1', { description: 'Đã cập nhật', registrationDeadline: null })
    expect(repo.update).toHaveBeenCalled()

    await expect(WorkshopService.update('workshop-1', { startsAt: inHours(-2), endsAt: inHours(-1) })).rejects.toThrow(
      'Thời gian bắt đầu phải sau'
    )
  })

  it('không cho giảm số chỗ xuống dưới số chỗ đã đặt', async () => {
    repo.findById.mockResolvedValue(makeWorkshop())
    registrationRepo.countBookedSeats.mockResolvedValue(new Map([['workshop-1', 8]]))

    await expect(WorkshopService.update('workshop-1', { capacity: 7 })).rejects.toThrow(
      'Lớp đã có 8 chỗ được đặt, số chỗ không được nhỏ hơn 8'
    )
    await WorkshopService.update('workshop-1', { capacity: 8 })
    expect(repo.update).toHaveBeenCalledTimes(1)
  })

  it('báo 404 khi không tìm thấy', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(WorkshopService.update('workshop-1', { capacity: 10 })).rejects.toThrow(NotFoundError)
  })
})

describe('WorkshopService.remove', () => {
  it('xoá mềm lớp', async () => {
    repo.findById.mockResolvedValue(makeWorkshop())

    await WorkshopService.remove('workshop-1')

    expect(repo.softDelete).toHaveBeenCalledWith('workshop-1')
  })

  it('không xoá lớp đã có người đăng ký', async () => {
    repo.findById.mockResolvedValue(makeWorkshop())
    registrationRepo.countByWorkshop.mockResolvedValue(2)

    await expect(WorkshopService.remove('workshop-1')).rejects.toThrow(ConflictError)
    expect(repo.softDelete).not.toHaveBeenCalled()
  })
})
