import { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { AUTH_SCOPE } from '@common/constants'
import { ForbiddenError, UnauthorizedError } from '@common/errors'
import AuthMiddleware from '@common/middlewares/auth.middleware'
import { JWTService } from '@common/services'

const res = {} as Response

const run = (middleware: (req: Request, res: Response, next: NextFunction) => void, req: Partial<Request>) => {
  const next = vi.fn()
  middleware(req as Request, res, next)
  return { next, req: req as Request }
}

describe('AuthMiddleware.authenticate', () => {
  it('gắn thông tin user vào request khi access token hợp lệ', () => {
    const token = JWTService.generateAccessToken({ sub: 'user-1', email: 'an.nguyen@gmail.com', role: 'user' })
    const { next, req } = run(AuthMiddleware.authenticate, { headers: { authorization: `Bearer ${token}` } })

    expect(next).toHaveBeenCalledWith()
    expect(req.user).toEqual({ id: 'user-1', email: 'an.nguyen@gmail.com', role: 'user' })
  })

  it.each([
    ['không có header Authorization', undefined],
    ['sai định dạng Bearer', 'Token abc'],
    ['token không hợp lệ', 'Bearer abc.def.ghi']
  ])('trả 401 khi %s', (_case, authorization) => {
    const { next } = run(AuthMiddleware.authenticate, { headers: { authorization } })

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
  })
})

describe('AuthMiddleware.authenticateRefreshToken', () => {
  const middleware = AuthMiddleware.authenticateRefreshToken(AUTH_SCOPE.CLIENT)

  it('đọc refresh token từ cookie của đúng scope', () => {
    const token = JWTService.generateRefreshToken({ sub: 'user-1' })
    const { next, req } = run(middleware, { cookies: { [AUTH_SCOPE.CLIENT.cookieName]: token } })

    expect(next).toHaveBeenCalledWith()
    expect(req.refreshUserId).toBe('user-1')
  })

  it('không nhận cookie của scope khác (admin)', () => {
    const token = JWTService.generateRefreshToken({ sub: 'user-1' })
    const { next } = run(middleware, { cookies: { [AUTH_SCOPE.ADMIN.cookieName]: token } })

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
  })

  it('trả 401 khi refresh token không hợp lệ', () => {
    const { next } = run(middleware, { cookies: { [AUTH_SCOPE.CLIENT.cookieName]: 'invalid' } })

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
  })
})

describe('AuthMiddleware.authorize', () => {
  const adminOnly = AuthMiddleware.authorize(['admin'])

  it('cho qua khi user có quyền', () => {
    const { next } = run(adminOnly, { user: { id: 'user-1', email: 'admin@gmail.com', role: 'admin' } })
    expect(next).toHaveBeenCalledWith()
  })

  it('trả 403 khi user không có quyền', () => {
    const { next } = run(adminOnly, { user: { id: 'user-1', email: 'an.nguyen@gmail.com', role: 'user' } })
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
  })

  it('trả 401 khi chưa đăng nhập', () => {
    const { next } = run(adminOnly, {})
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
  })
})
