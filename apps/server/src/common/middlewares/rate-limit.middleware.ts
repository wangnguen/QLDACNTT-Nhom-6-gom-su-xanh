import { Request, Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes'

import {
  RATE_LIMIT_MAX_REQUESTS_AUTH,
  RATE_LIMIT_MAX_REQUESTS_DEV,
  RATE_LIMIT_MAX_REQUESTS_GLOBAL,
  RATE_LIMIT_WINDOW_MS
} from '@common/constants'

const isProduction = process.env.NODE_ENV === 'production'

// Global limiter chạy trước ResponseMiddleware nên trả JSON trực tiếp, cùng format với các lỗi khác
const tooManyRequestsHandler = (req: Request, res: Response) => {
  res.status(StatusCodes.TOO_MANY_REQUESTS).json({
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  })
}

export const globalRateLimiterMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: isProduction ? RATE_LIMIT_MAX_REQUESTS_GLOBAL : RATE_LIMIT_MAX_REQUESTS_DEV,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler
})

export const authRateLimiterMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: isProduction ? RATE_LIMIT_MAX_REQUESTS_AUTH : RATE_LIMIT_MAX_REQUESTS_DEV,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler
})
