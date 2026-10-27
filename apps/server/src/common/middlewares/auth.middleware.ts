import { NextFunction, Request, Response } from 'express'

import { AuthScope } from '@common/constants'
import { ForbiddenError, UnauthorizedError } from '@common/errors'
import { JWTService } from '@common/services'

class AuthMiddleware {
  static authenticate(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'))
    }

    const token = authHeader.split(' ')[1]

    try {
      const payload = JWTService.verifyAccessToken(token)

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      }
      return next()
    } catch {
      return next(new UnauthorizedError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'))
    }
  }

  static authenticateRefreshToken(scope: AuthScope) {
    return (req: Request, _res: Response, next: NextFunction) => {
      const refreshToken = req.cookies[scope.cookieName]
      if (!refreshToken) return next(new UnauthorizedError('Phiên đăng nhập đã hết hạn'))

      try {
        const payload = JWTService.verifyRefreshToken(refreshToken)

        req.refreshUserId = payload.sub

        return next()
      } catch {
        return next(new UnauthorizedError('Phiên đăng nhập đã hết hạn'))
      }
    }
  }

  static authorize(roles: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new UnauthorizedError())
      }

      if (!roles.includes(req.user.role)) {
        return next(new ForbiddenError('Bạn không có quyền truy cập'))
      }

      next()
    }
  }
}

export default AuthMiddleware
