import { describe, expect, it } from 'vitest'

import { AdminPostQuerySchema, CreatePostBodySchema, UpdatePostBodySchema } from '@modules/post/dto'

const CATEGORY_ID = 'd4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f70'

const validBody = {
  title: ' Phân biệt men lam và men rạn ',
  content: ' Men lam là lớp men trong phủ trên hoạ tiết vẽ bằng coban. ',
  categoryId: CATEGORY_ID
}

describe('CreatePostBodySchema', () => {
  it('mặc định lưu nháp, cắt khoảng trắng, tóm tắt rỗng = null', () => {
    expect(CreatePostBodySchema.parse({ ...validBody, excerpt: ' ' })).toEqual({
      title: 'Phân biệt men lam và men rạn',
      content: 'Men lam là lớp men trong phủ trên hoạ tiết vẽ bằng coban.',
      categoryId: CATEGORY_ID,
      excerpt: null,
      status: 'draft'
    })
  })

  it.each([
    ['thiếu tiêu đề', { title: '' }],
    ['nội dung quá ngắn', { content: 'Ngắn' }],
    ['nội dung quá dài', { content: 'a'.repeat(50_001) }],
    ['ảnh bìa không phải URL', { coverImageUrl: 'men-lam.jpg' }],
    ['danh mục không phải UUID', { categoryId: 'kien-thuc-gom' }],
    ['trạng thái lạ', { status: 'scheduled' }],
    ['tóm tắt quá 500 ký tự', { excerpt: 'a'.repeat(501) }]
  ])('từ chối khi %s', (_case, override) => {
    expect(CreatePostBodySchema.safeParse({ ...validBody, ...override }).success).toBe(false)
  })
})

describe('UpdatePostBodySchema', () => {
  it('cập nhật một phần, xoá ảnh bìa bằng null', () => {
    expect(UpdatePostBodySchema.parse({ coverImageUrl: null })).toEqual({ coverImageUrl: null })
  })

  it('từ chối body rỗng', () => {
    expect(UpdatePostBodySchema.safeParse({}).success).toBe(false)
  })
})

describe('AdminPostQuerySchema', () => {
  it('lọc theo trạng thái và danh mục', () => {
    expect(AdminPostQuerySchema.parse({ status: 'draft', categoryId: CATEGORY_ID })).toEqual({
      limit: 12,
      offset: 0,
      status: 'draft',
      categoryId: CATEGORY_ID
    })
  })
})
