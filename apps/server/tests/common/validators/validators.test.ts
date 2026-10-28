import { describe, expect, it } from 'vitest'

import { addressSchema, emailSchema, otpSchema, passwordSchema, phoneSchema } from '@common/validators'

describe('passwordSchema', () => {
  it.each(['GomSu@2026', 'Abcdef1!', 'A1!' + 'a'.repeat(69)])('chấp nhận mật khẩu hợp lệ: %s', (password) => {
    expect(passwordSchema.safeParse(password).success).toBe(true)
  })

  it.each([
    ['ngắn hơn 8 ký tự', 'Ab1!'],
    ['dài hơn 72 ký tự', 'A1!' + 'a'.repeat(70)],
    ['thiếu chữ hoa', 'gomsu@2026'],
    ['thiếu chữ thường', 'GOMSU@2026'],
    ['thiếu chữ số', 'GomSu@abcd'],
    ['thiếu ký tự đặc biệt', 'GomSu2026'],
    ['chứa khoảng trắng', 'Gom Su@2026']
  ])('từ chối mật khẩu %s', (_case, password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false)
  })
})

describe('emailSchema', () => {
  it('cắt khoảng trắng và chuyển về chữ thường', () => {
    expect(emailSchema.parse('  An.Nguyen@Gmail.COM ')).toBe('an.nguyen@gmail.com')
  })

  it.each(['an.nguyen', 'an@', '@gmail.com', ''])('từ chối email không hợp lệ: "%s"', (email) => {
    expect(emailSchema.safeParse(email).success).toBe(false)
  })
})

describe('phoneSchema', () => {
  it('chấp nhận số 10 chữ số bắt đầu bằng 0', () => {
    expect(phoneSchema.parse(' 0912345678 ')).toBe('0912345678')
  })

  it.each(['912345678', '09123456789', '+84912345678', '09123abcde'])('từ chối số điện thoại: %s', (phone) => {
    expect(phoneSchema.safeParse(phone).success).toBe(false)
  })
})

describe('otpSchema', () => {
  it('chấp nhận đúng 6 chữ số', () => {
    expect(otpSchema.parse(' 123456 ')).toBe('123456')
  })

  it.each(['12345', '1234567', '12a456'])('từ chối mã OTP: %s', (otp) => {
    expect(otpSchema.safeParse(otp).success).toBe(false)
  })
})

describe('addressSchema', () => {
  it('chuỗi rỗng được hiểu là xoá địa chỉ (null)', () => {
    expect(addressSchema.parse('   ')).toBeNull()
  })

  it('giữ nguyên địa chỉ sau khi cắt khoảng trắng', () => {
    expect(addressSchema.parse(' 12 Bát Tràng ')).toBe('12 Bát Tràng')
  })

  it('từ chối địa chỉ dài hơn 255 ký tự', () => {
    expect(addressSchema.safeParse('a'.repeat(256)).success).toBe(false)
  })
})
