import { Response as ExpressResponse } from 'express'

import { ErrorPayload, SuccessPayload } from '@common/types/index'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
      refreshUserId?: string
    }
    interface Response {
      ok<T>(data: T, payload?: SuccessPayload): ExpressResponse
      created<T>(data: T, payload?: SuccessPayload): ExpressResponse
      fail(payload?: ErrorPayload): ExpressResponse
      notFound(payload?: ErrorPayload): ExpressResponse
      validationError(payload?: ErrorPayload): ExpressResponse
      internalError(payload?: ErrorPayload): ExpressResponse
    }
  }
}

export {}
