import { describe, expect, it } from 'vitest'

import { CreateRegistrationBodySchema } from '@modules/workshop-registration/dto'

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
