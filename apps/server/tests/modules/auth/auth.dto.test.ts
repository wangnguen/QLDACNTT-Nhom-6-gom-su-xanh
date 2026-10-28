import { describe, expect, it } from 'vitest'

import {
  ChangePasswordBodySchema,
  LoginBodySchema,
  RegisterBodyExample,
  RegisterBodySchema,
  ResetPasswordBodyExample,
  ResetPasswordBodySchema
} from '@modules/auth/dto'

const issuePaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? []

describe('RegisterBodySchema', () => {
  it('chấp nhận dữ liệu đăng ký hợp lệ', () => {
    expect(RegisterBodySchema.safeParse(RegisterBodyExample).success).toBe(true)
  })

  it('báo lỗi ở confirmPassword khi mật khẩu xác nhận không khớp', () => {
    const result = RegisterBodySchema.safeParse({ ...RegisterBodyExample, confirmPassword: 'GomSu@2027' })
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toEqual(['confirmPassword'])
  })

  it('chuẩn hoá email về chữ thường', () => {
    const result = RegisterBodySchema.parse({ ...RegisterBodyExample, email: 'An.Nguyen@Gmail.com' })
    expect(result.email).toBe('an.nguyen@gmail.com')
  })
})

describe('LoginBodySchema', () => {
  it.each(['an.nguyen@gmail.com', '0912345678'])(
    'cho phép đăng nhập bằng email hoặc số điện thoại: %s',
    (identifier) => {
      expect(LoginBodySchema.safeParse({ identifier, password: 'x' }).success).toBe(true)
    }
  )

  it('từ chối identifier không phải email hay số điện thoại', () => {
    const result = LoginBodySchema.safeParse({ identifier: 'an.nguyen', password: 'x' })
    expect(issuePaths(result)).toEqual(['identifier'])
  })
})

describe('ResetPasswordBodySchema', () => {
  it('chấp nhận dữ liệu hợp lệ', () => {
    expect(ResetPasswordBodySchema.safeParse(ResetPasswordBodyExample).success).toBe(true)
  })

  it('báo lỗi khi mật khẩu xác nhận không khớp', () => {
    const result = ResetPasswordBodySchema.safeParse({ ...ResetPasswordBodyExample, confirmPassword: 'Khac@2027' })
    expect(issuePaths(result)).toEqual(['confirmPassword'])
  })
})

describe('ChangePasswordBodySchema', () => {
  it('báo lỗi khi mật khẩu mới trùng mật khẩu hiện tại', () => {
    const result = ChangePasswordBodySchema.safeParse({
      currentPassword: 'GomSu@2026',
      newPassword: 'GomSu@2026',
      confirmPassword: 'GomSu@2026'
    })
    expect(issuePaths(result)).toEqual(['newPassword'])
  })

  it('báo lỗi khi mật khẩu xác nhận không khớp', () => {
    const result = ChangePasswordBodySchema.safeParse({
      currentPassword: 'GomSu@2026',
      newPassword: 'GomSu@2027',
      confirmPassword: 'GomSu@2028'
    })
    expect(issuePaths(result)).toEqual(['confirmPassword'])
  })
})
