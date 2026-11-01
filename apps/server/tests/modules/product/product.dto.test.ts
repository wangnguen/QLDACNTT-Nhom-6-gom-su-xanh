import { describe, expect, it } from 'vitest'

import { AdminProductQuerySchema, CreateProductBodySchema, UpdateProductBodySchema } from '@modules/product/dto'

const CATEGORY_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890'

const validBody = {
  name: 'Bình hoa men lam',
  categoryId: CATEGORY_ID,
  price: 450000
}

describe('CreateProductBodySchema', () => {
  it('điền giá trị mặc định: tồn kho 0, không ảnh, đang bán', () => {
    expect(CreateProductBodySchema.parse(validBody)).toEqual({ ...validBody, stock: 0, imageUrls: [], isActive: true })
  })

  it('chuỗi rỗng ở các trường mô tả thành null', () => {
    const result = CreateProductBodySchema.parse({ ...validBody, description: ' ', material: '', dimensions: null })
    expect(result).toMatchObject({ description: null, material: null, dimensions: null })
  })

  it.each([
    ['thiếu danh mục', { ...validBody, categoryId: undefined }],
    ['giá bằng 0', { ...validBody, price: 0 }],
    ['giá lẻ', { ...validBody, price: 1.5 }],
    ['giá là chuỗi', { ...validBody, price: '450000' }],
    ['tồn kho âm', { ...validBody, stock: -1 }],
    ['quá 8 ảnh', { ...validBody, imageUrls: Array.from({ length: 9 }, (_, i) => `https://e.com/${i}.jpg`) }],
    ['ảnh trùng nhau', { ...validBody, imageUrls: ['https://e.com/1.jpg', 'https://e.com/1.jpg'] }],
    ['ảnh không phải URL', { ...validBody, imageUrls: ['anh-1.jpg'] }]
  ])('từ chối khi %s', (_case, body) => {
    expect(CreateProductBodySchema.safeParse(body).success).toBe(false)
  })

  it('báo "Vui lòng chọn danh mục" khi thiếu danh mục', () => {
    const result = CreateProductBodySchema.safeParse({ ...validBody, categoryId: undefined })
    expect(result.error?.issues[0].message).toBe('Vui lòng chọn danh mục')
  })
})

describe('UpdateProductBodySchema', () => {
  it('chỉ giữ các trường được gửi lên', () => {
    expect(UpdateProductBodySchema.parse({ price: 420000, isActive: false })).toEqual({
      price: 420000,
      isActive: false
    })
  })

  it('báo lỗi khi không gửi trường nào', () => {
    expect(UpdateProductBodySchema.safeParse({}).success).toBe(false)
  })
})

describe('AdminProductQuerySchema', () => {
  it('mặc định 12 sản phẩm/trang, mới nhất trước', () => {
    expect(AdminProductQuerySchema.parse({})).toEqual({ limit: 12, offset: 0, sort: 'newest' })
  })

  it('ép kiểu số từ query string, bỏ qua từ khoá rỗng', () => {
    expect(AdminProductQuerySchema.parse({ limit: '24', offset: '24', search: '  ', status: 'hidden' })).toEqual({
      limit: 24,
      offset: 24,
      search: undefined,
      status: 'hidden',
      sort: 'newest'
    })
  })

  it.each([{ limit: '1000' }, { offset: '-1' }, { sort: 'popular' }, { status: 'deleted' }, { categoryId: 'abc' }])(
    'từ chối query không hợp lệ: %o',
    (query) => {
      expect(AdminProductQuerySchema.safeParse(query).success).toBe(false)
    }
  )
})
