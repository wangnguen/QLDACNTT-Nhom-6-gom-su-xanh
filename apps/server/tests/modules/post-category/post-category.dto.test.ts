import { describe, expect, it } from 'vitest'

import { CreatePostCategoryBodySchema, UpdatePostCategoryBodySchema } from '@modules/post-category/dto'

describe('CreatePostCategoryBodySchema', () => {
  it('cắt khoảng trắng tên, mô tả rỗng = null', () => {
    expect(CreatePostCategoryBodySchema.parse({ name: ' Kiến thức gốm ', description: ' ' })).toEqual({
      name: 'Kiến thức gốm',
      description: null
    })
  })

  it.each([
    ['thiếu tên', {}],
    ['tên chỉ có ký tự đặc biệt', { name: '!!!' }],
    ['tên quá 100 ký tự', { name: 'a'.repeat(101) }],
    ['mô tả quá 500 ký tự', { name: 'Tin tức', description: 'a'.repeat(501) }],
    ['isActive không phải boolean', { name: 'Tin tức', isActive: 'yes' }]
  ])('từ chối khi %s', (_case, body) => {
    expect(CreatePostCategoryBodySchema.safeParse(body).success).toBe(false)
  })
})

describe('UpdatePostCategoryBodySchema', () => {
  it('cập nhật một phần', () => {
    expect(UpdatePostCategoryBodySchema.parse({ isActive: false })).toEqual({ isActive: false })
  })

  it('từ chối body rỗng', () => {
    expect(UpdatePostCategoryBodySchema.safeParse({}).success).toBe(false)
  })
})
