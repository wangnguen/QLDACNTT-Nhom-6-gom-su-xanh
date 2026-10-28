import { describe, expect, it } from 'vitest'

import { generateRandomDigits, hashAuthToken, safeEqual } from '@common/utils/random'

describe('generateRandomDigits', () => {
  it('mặc định sinh 6 chữ số', () => {
    expect(generateRandomDigits()).toMatch(/^\d{6}$/)
  })

  it('sinh đúng độ dài yêu cầu', () => {
    expect(generateRandomDigits(10)).toMatch(/^\d{10}$/)
  })

  it('các lần gọi cho ra mã khác nhau', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRandomDigits()))
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe('hashAuthToken', () => {
  it('cùng mã cho cùng kết quả HMAC-SHA256 (64 ký tự hex)', () => {
    const hash = hashAuthToken('123456')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hashAuthToken('123456')).toBe(hash)
  })

  it('không lưu mã gốc: kết quả khác mã đầu vào', () => {
    expect(hashAuthToken('123456')).not.toContain('123456')
  })

  it('mã khác nhau cho kết quả khác nhau', () => {
    expect(hashAuthToken('123456')).not.toBe(hashAuthToken('654321'))
  })
})

describe('safeEqual', () => {
  it('trả về true khi hai chuỗi giống nhau', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
  })

  it('trả về false khi khác nội dung', () => {
    expect(safeEqual('abc', 'abd')).toBe(false)
  })

  it('trả về false (không ném lỗi) khi khác độ dài', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})
