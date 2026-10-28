import { describe, expect, it } from 'vitest'

import { UpdateProfileBodySchema } from '@modules/user/dto'

describe('UpdateProfileBodySchema', () => {
  it('chỉ cần gửi một trường', () => {
    expect(UpdateProfileBodySchema.parse({ fullName: ' Trần Thị Bình ' })).toEqual({ fullName: 'Trần Thị Bình' })
  })

  it('báo lỗi khi không gửi trường nào', () => {
    expect(UpdateProfileBodySchema.safeParse({}).success).toBe(false)
  })

  it('cho phép xoá giới tính (null) và xoá địa chỉ (chuỗi rỗng)', () => {
    expect(UpdateProfileBodySchema.parse({ gender: null, address: '' })).toEqual({ gender: null, address: null })
  })

  it('từ chối giới tính không hợp lệ', () => {
    expect(UpdateProfileBodySchema.safeParse({ gender: 'unknown' }).success).toBe(false)
  })
})
