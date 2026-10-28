import { describe, expect, it } from 'vitest'

import { JWTService } from '@common/services'

const payload = { sub: 'user-1', email: 'an.nguyen@gmail.com', role: 'user' }

describe('JWTService', () => {
  it('access token tạo ra giải mã lại được đúng payload', () => {
    const token = JWTService.generateAccessToken(payload)
    expect(JWTService.verifyAccessToken(token)).toMatchObject(payload)
  })

  it('refresh token tạo ra giải mã lại được đúng user', () => {
    const token = JWTService.generateRefreshToken({ sub: 'user-1' })
    expect(JWTService.verifyRefreshToken(token)).toMatchObject({ sub: 'user-1' })
  })

  it('không dùng refresh token thay access token được (khác secret)', () => {
    const refreshToken = JWTService.generateRefreshToken({ sub: 'user-1' })
    expect(() => JWTService.verifyAccessToken(refreshToken)).toThrow()
  })

  it('từ chối token bị sửa', () => {
    const token = JWTService.generateAccessToken(payload)
    expect(() => JWTService.verifyAccessToken(`${token}x`)).toThrow()
  })

  it('hai refresh token tạo cùng lúc cho cùng user vẫn khác nhau', () => {
    const first = JWTService.generateRefreshToken({ sub: 'user-1' })
    const second = JWTService.generateRefreshToken({ sub: 'user-1' })
    expect(first).not.toBe(second)
  })

  it('hash refresh token ổn định để tra cứu trong DB', () => {
    const hash = JWTService.hashRefreshToken('some-token')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(JWTService.hashRefreshToken('some-token')).toBe(hash)
  })
})
