import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, NotFoundError } from '@common/errors'

import WorkshopRepository from '@modules/workshop/workshop.repository'
import WorkshopService from '@modules/workshop/workshop.service'

import { makeWorkshop } from '../../helpers/factories'

vi.mock('@modules/workshop/workshop.repository', () => ({
  default: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findSlugsWithBase: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn()
  }
}))

const repo = vi.mocked(WorkshopRepository)

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
})
