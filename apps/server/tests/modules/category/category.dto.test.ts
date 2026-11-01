import { describe, expect, it } from 'vitest'

import { CreateCategoryBodySchema, UpdateCategoryBodySchema } from '@modules/category/dto'

describe('CreateCategoryBodySchema', () => {
  it('chuẩn hoá tên, mô tả rỗng thành null', () => {
    expect(CreateCategoryBodySchema.parse({ name: '  Bình hoa ', description: '  ' })).toEqual({
      name: 'Bình hoa',
      description: null
    })
  })

  it.each([
    ['thiếu tên', {}],
    ['tên rỗng', { name: '  ' }],
    ['tên chỉ có ký tự đặc biệt', { name: '!!!' }],
    ['tên quá 100 ký tự', { name: 'a'.repeat(101) }],
    ['link ảnh không phải http(s)', { name: 'Bình hoa', imageUrl: 'ftp://example.com/a.jpg' }],
    ['link ảnh javascript:', { name: 'Bình hoa', imageUrl: 'javascript:alert(1)' }]
  ])('từ chối khi %s', (_case, body) => {
    expect(CreateCategoryBodySchema.safeParse(body).success).toBe(false)
  })
})

describe('UpdateCategoryBodySchema', () => {
  it('cho phép xoá ảnh (null) hoặc chỉ đổi trạng thái', () => {
    expect(UpdateCategoryBodySchema.parse({ imageUrl: null })).toEqual({ imageUrl: null })
    expect(UpdateCategoryBodySchema.parse({ isActive: false })).toEqual({ isActive: false })
  })

  it('báo lỗi khi không gửi trường nào', () => {
    expect(UpdateCategoryBodySchema.safeParse({}).success).toBe(false)
  })
})
