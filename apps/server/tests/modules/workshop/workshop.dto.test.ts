import { describe, expect, it } from 'vitest'

import {
  AdminWorkshopQuerySchema,
  CreateWorkshopBodySchema,
  UpdateWorkshopBodySchema,
  WorkshopQuerySchema
} from '@modules/workshop/dto'

const validBody = {
  name: 'Lớp vuốt gốm cơ bản',
  location: '12 Bát Tràng, Gia Lâm, Hà Nội',
  startsAt: '2026-12-05T09:00:00+07:00',
  endsAt: '2026-12-05T11:30:00+07:00',
  price: 350000,
  capacity: 12
}

describe('CreateWorkshopBodySchema', () => {
  it('đổi thời điểm sang Date và điền giá trị mặc định', () => {
    const result = CreateWorkshopBodySchema.parse(validBody)

    expect(result.startsAt).toEqual(new Date('2026-12-05T02:00:00.000Z'))
    expect(result.endsAt).toEqual(new Date('2026-12-05T04:30:00.000Z'))
    expect(result).toMatchObject({ imageUrls: [], isActive: true })
  })

  it('nhận thời điểm dạng UTC (Z) và học phí 0 (miễn phí)', () => {
    const result = CreateWorkshopBodySchema.parse({ ...validBody, startsAt: '2026-12-05T02:00:00.000Z', price: 0 })
    expect(result.price).toBe(0)
  })

  it('chuỗi rỗng ở mô tả, người hướng dẫn = xoá (null)', () => {
    const result = CreateWorkshopBodySchema.parse({ ...validBody, description: '  ', instructor: '' })
    expect(result).toMatchObject({ description: null, instructor: null })
  })

  it.each([
    ['thiếu tên', { name: '' }],
    ['tên không có chữ', { name: '!!!' }],
    ['thiếu địa điểm', { location: ' ' }],
    ['thời điểm không có múi giờ', { startsAt: '2026-12-05T09:00:00' }],
    ['thời điểm sai định dạng', { endsAt: '05/12/2026 11:30' }],
    ['học phí âm', { price: -1 }],
    ['học phí lẻ', { price: 1.5 }],
    ['số chỗ bằng 0', { capacity: 0 }],
    ['số chỗ quá 200', { capacity: 201 }],
    ['link ảnh không phải http', { imageUrls: ['ftp://example.com/a.jpg'] }],
    ['link ảnh bị trùng', { imageUrls: ['https://example.com/a.jpg', 'https://example.com/a.jpg'] }]
  ])('từ chối khi %s', (_case, override) => {
    expect(CreateWorkshopBodySchema.safeParse({ ...validBody, ...override }).success).toBe(false)
  })
})

describe('UpdateWorkshopBodySchema', () => {
  it('cho gửi null để bỏ hạn đăng ký', () => {
    expect(UpdateWorkshopBodySchema.parse({ registrationDeadline: null })).toEqual({ registrationDeadline: null })
  })

  it('từ chối body rỗng', () => {
    expect(UpdateWorkshopBodySchema.safeParse({}).success).toBe(false)
  })
})

describe('AdminWorkshopQuerySchema', () => {
  it('mặc định sắp xếp lớp sắp diễn ra trước', () => {
    expect(AdminWorkshopQuerySchema.parse({})).toEqual({ limit: 12, offset: 0, sort: 'start_asc' })
  })

  it('từ chối bộ lọc không hợp lệ', () => {
    expect(AdminWorkshopQuerySchema.safeParse({ time: 'tomorrow' }).success).toBe(false)
    expect(AdminWorkshopQuerySchema.safeParse({ status: 'deleted' }).success).toBe(false)
  })
})

describe('WorkshopQuerySchema', () => {
  it('đổi availableOnly thành boolean, giữ ngày dạng chuỗi', () => {
    expect(WorkshopQuerySchema.parse({ availableOnly: 'true', from: '2026-12-01', to: '2026-12-01' })).toMatchObject({
      availableOnly: true,
      from: '2026-12-01',
      to: '2026-12-01'
    })
  })

  it.each([
    ['ngày sai định dạng', { from: '01/12/2026' }],
    ['ngày không tồn tại', { to: '2026-02-30' }],
    ['từ ngày sau đến ngày', { from: '2026-12-10', to: '2026-12-01' }],
    ['availableOnly không phải boolean', { availableOnly: 'maybe' }]
  ])('từ chối khi %s', (_case, query) => {
    expect(WorkshopQuerySchema.safeParse(query).success).toBe(false)
  })
})
