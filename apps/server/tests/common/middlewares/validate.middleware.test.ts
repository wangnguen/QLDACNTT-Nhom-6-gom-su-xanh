import { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod/v4'

import { ValidationError } from '@common/errors'
import { validateBody, validateQuery } from '@common/middlewares/validate.middleware'
import { emailSchema } from '@common/validators'

const schema = z.object({ email: emailSchema })

describe('validateBody', () => {
  it('thay body bằng dữ liệu đã chuẩn hoá khi hợp lệ', () => {
    const req = { body: { email: ' An.Nguyen@Gmail.com ' } } as Request
    const next = vi.fn()

    validateBody(schema)(req, {} as Response, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ email: 'an.nguyen@gmail.com' })
  })

  it('trả ValidationError kèm tên trường lỗi', () => {
    const req = { body: { email: 'khong-phai-email' } } as Request
    const next = vi.fn()

    validateBody(schema)(req, {} as Response, next)

    const error = next.mock.lastCall?.[0]
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.errors).toEqual([expect.objectContaining({ field: 'body.email', message: 'Email không hợp lệ' })])
  })
})

describe('validateQuery', () => {
  it('chỉ kiểm tra, không ghi đè req.query', () => {
    const query = { email: ' An.Nguyen@Gmail.com ' }
    const req = { query } as unknown as Request
    const next = vi.fn()

    validateQuery(schema)(req, {} as Response, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.query).toBe(query)
  })
})
