import { NextFunction, Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { QueryFailedError } from 'typeorm'

import env from '@common/config/env'
import logger from '@common/config/logger'
import { AppError, ValidationError } from '@common/errors'

const PG_UNIQUE_VIOLATION = '23505'

class ErrorMiddleware {
  static notFound(req: Request, res: Response) {
    res.notFound({ message: `Route ${req.originalUrl} not found` })
  }

  static errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ValidationError) {
      return res.validationError({ message: err.message, errors: err.errors })
    }

    if (err instanceof AppError) {
      return res.fail({ message: err.message, statusCode: err.statusCode })
    }

    // Body gửi lên không phải JSON hợp lệ (lỗi từ express.json)
    if ('type' in err && err.type === 'entity.parse.failed') {
      return res.fail({ message: 'Body JSON không hợp lệ' })
    }

    // Hai request cùng ghi một giá trị unique (vd: đăng ký trùng email cùng lúc)
    if (err instanceof QueryFailedError && (err.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION) {
      return res.fail({ statusCode: StatusCodes.CONFLICT, message: 'Dữ liệu đã tồn tại' })
    }

    logger.error(err, 'Unhandled error')
    res.internalError({
      message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      ...(env.NODE_ENV === 'development' && { errors: [{ field: 'stack', message: err.stack || '' }] })
    })
  }
}

export default ErrorMiddleware
