import { describe, expect, it } from 'vitest'

import {
  AdminRegistrationQuerySchema,
  CancelRegistrationBodySchema,
  CreateRegistrationBodySchema,
  MyRegistrationQuerySchema,
  UpdateRegistrationStatusBodySchema
} from '@modules/workshop-registration/dto'

const WORKSHOP_ID = '5b6c7d8e-9f01-4234-8567-89abcdef0123'

const validBody = { workshopId: WORKSHOP_ID, contactName: ' Nguyễn Văn An ', contactPhone: '0912345678' }

describe('CreateRegistrationBodySchema', () => {
  it('mặc định đặt 1 chỗ, cắt khoảng trắng tên, ghi chú rỗng = null', () => {
    expect(CreateRegistrationBodySchema.parse({ ...validBody, note: '  ' })).toEqual({
      workshopId: WORKSHOP_ID,
      seats: 1,
      contactName: 'Nguyễn Văn An',
      contactPhone: '0912345678',
      note: null
    })
  })

  it.each([
    ['thiếu lớp', { workshopId: undefined }],
    ['workshopId không phải UUID', { workshopId: 'lop-vuot-gom' }],
    ['số chỗ bằng 0', { seats: 0 }],
    ['số chỗ quá 10', { seats: 11 }],
    ['số chỗ là chuỗi', { seats: '2' }],
    ['thiếu tên liên hệ', { contactName: '' }],
    ['số điện thoại sai', { contactPhone: '12345' }],
    ['ghi chú quá 500 ký tự', { note: 'a'.repeat(501) }]
  ])('từ chối khi %s', (_case, override) => {
    expect(CreateRegistrationBodySchema.safeParse({ ...validBody, ...override }).success).toBe(false)
  })
})

describe('CancelRegistrationBodySchema', () => {
  it('body rỗng hoặc không gửi body đều được, lý do rỗng = null', () => {
    expect(CancelRegistrationBodySchema.parse(undefined)).toEqual({ reason: null })
    expect(CancelRegistrationBodySchema.parse({})).toEqual({ reason: null })
    expect(CancelRegistrationBodySchema.parse({ reason: '  ' })).toEqual({ reason: null })
    expect(CancelRegistrationBodySchema.parse({ reason: 'Bận việc' })).toEqual({ reason: 'Bận việc' })
  })

  it('từ chối lý do quá 255 ký tự', () => {
    expect(CancelRegistrationBodySchema.safeParse({ reason: 'a'.repeat(256) }).success).toBe(false)
  })
})

describe('UpdateRegistrationStatusBodySchema', () => {
  it.each(['confirmed', 'attended', 'cancelled'])('nhận trạng thái %s', (status) => {
    expect(UpdateRegistrationStatusBodySchema.safeParse({ status }).success).toBe(true)
  })

  it('không cho chuyển về pending hoặc trạng thái lạ', () => {
    expect(UpdateRegistrationStatusBodySchema.safeParse({ status: 'pending' }).success).toBe(false)
    expect(UpdateRegistrationStatusBodySchema.safeParse({ status: 'done' }).success).toBe(false)
  })
})

describe('Registration query schemas', () => {
  it('lọc theo trạng thái và lớp', () => {
    expect(MyRegistrationQuerySchema.parse({ status: 'cancelled', workshopId: WORKSHOP_ID })).toMatchObject({
      status: 'cancelled',
      workshopId: WORKSHOP_ID
    })
    expect(AdminRegistrationQuerySchema.parse({ search: ' WS7K ' })).toMatchObject({ search: 'WS7K' })
  })

  it('từ chối trạng thái hoặc workshopId không hợp lệ', () => {
    expect(MyRegistrationQuerySchema.safeParse({ status: 'done' }).success).toBe(false)
    expect(AdminRegistrationQuerySchema.safeParse({ workshopId: 'abc' }).success).toBe(false)
  })
})
