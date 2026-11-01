import { describe, expect, it } from 'vitest'

import { nextAvailableSlug, slugify } from '@common/utils/slug'

describe('slugify', () => {
  it.each([
    ['Bình hoa men lam', 'binh-hoa-men-lam'],
    ['Đĩa sứ ĐÔNG HỒ', 'dia-su-dong-ho'],
    ['  Ấm chén -- Bát Tràng!!  ', 'am-chen-bat-trang'],
    ['Lọ 30cm (men rạn)', 'lo-30cm-men-ran'],
    ['!!!', '']
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('cắt tối đa 100 ký tự và không kết thúc bằng dấu gạch', () => {
    const slug = slugify(`${'a'.repeat(99)} bcd`)
    expect(slug).toBe('a'.repeat(99))
  })
})

describe('nextAvailableSlug', () => {
  it('giữ nguyên khi chưa ai dùng', () => {
    expect(nextAvailableSlug('binh-hoa', [])).toBe('binh-hoa')
  })

  it('thêm hậu tố nhỏ nhất còn trống', () => {
    expect(nextAvailableSlug('binh-hoa', ['binh-hoa'])).toBe('binh-hoa-2')
    expect(nextAvailableSlug('binh-hoa', ['binh-hoa', 'binh-hoa-2', 'binh-hoa-4'])).toBe('binh-hoa-3')
  })
})
