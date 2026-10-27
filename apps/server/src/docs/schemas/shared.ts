import { z, ZodType } from 'zod/v4'

import { registry } from '@docs/registry'

type NamedExample = { summary?: string; description?: string; value?: unknown }

export const jsonBody = (schema: ZodType, examples?: Record<string, NamedExample>) => ({
  body: {
    required: true,
    content: {
      'application/json': {
        schema,
        ...(examples && { examples })
      }
    }
  }
})

export const successWrapper = <T extends z.ZodTypeAny>(
  dataSchema: T,
  pathExample: string,
  statusCode: number = 200,
  message: string = 'OK'
) =>
  z.object({
    statusCode: z.number().meta({ example: statusCode }),
    message: z.string().meta({ example: message }),
    data: dataSchema,
    path: z.string().meta({ example: pathExample }),
    timestamp: z.string().datetime().meta({ example: '2026-10-27T10:30:00.000Z' })
  })

export const ErrorResponseSchema = z.object({
  statusCode: z.number().meta({ example: 400 }),
  message: z.string().meta({ example: 'Bad Request' }),
  path: z.string().meta({ example: '/api/v1/...' }),
  timestamp: z.string().datetime().meta({ example: '2026-10-27T10:30:00.000Z' })
})

const ValidationErrorResponseSchema = z.object({
  statusCode: z.number().meta({ example: 422 }),
  message: z.string().meta({ example: 'Dữ liệu không hợp lệ' }),
  path: z.string().meta({ example: '/api/v1/...' }),
  timestamp: z.string().datetime().meta({ example: '2026-10-27T10:30:00.000Z' }),
  errors: z
    .array(
      z.object({
        field: z.string().meta({ example: 'body.email' }),
        message: z.string().meta({ example: 'Email không hợp lệ' }),
        code: z.string().meta({ example: 'invalid_format' })
      })
    )
    .optional()
})

export const errorResponse = (statusCode: number, description: string, message: string) => ({
  description,
  content: {
    'application/json': {
      schema: ErrorResponseSchema.meta({
        example: { statusCode, message, path: '/api/v1/...', timestamp: '2026-10-27T10:30:00.000Z' }
      })
    }
  }
})

export const validationErrorResponse = (description: string = 'Dữ liệu không hợp lệ') => ({
  description,
  content: {
    'application/json': {
      schema: ValidationErrorResponseSchema
    }
  }
})

export const badRequestResponse = (description: string = 'Bad Request') => errorResponse(400, description, description)

export const unauthorizedResponse = (description: string = 'Unauthorized') =>
  errorResponse(401, description, description)

export const forbiddenResponse = (description: string = 'Forbidden') => errorResponse(403, description, description)

export const notFoundResponse = (description: string = 'Not Found') => errorResponse(404, description, description)

export const conflictResponse = (description: string = 'Conflict') => errorResponse(409, description, description)

export const rateLimitResponse = () =>
  errorResponse(429, 'Gọi API quá nhiều lần (rate limit)', 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút')

export const nullSuccessResponse = (path: string, message: string) => ({
  description: message,
  content: {
    'application/json': {
      schema: successWrapper(z.null(), path, 200, message)
    }
  }
})

export const AuthUserSchema = registry.register(
  'AuthUser',
  z.object({
    id: z.string().uuid().meta({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    email: z.string().email().meta({ example: 'nguyenvanan@gmail.com' }),
    fullName: z.string().meta({ example: 'Nguyễn Văn An' }),
    phone: z.string().nullable().meta({ example: '0912345678' }),
    role: z.enum(['user', 'admin']).meta({ example: 'user' }),
    avatarUrl: z.string().url().nullable().meta({ example: null }),
    isEmailVerified: z.boolean().meta({ example: true })
  })
)
