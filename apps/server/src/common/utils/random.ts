import { createHmac, randomInt, timingSafeEqual } from 'crypto'

import env from '@common/config/env'

export const generateRandomDigits = (length = 6): string => {
  return Array.from({ length }, () => randomInt(10)).join('')
}

export const hashAuthToken = (token: string): string => {
  return createHmac('sha256', env.AUTH_TOKEN_HASH_SECRET).update(token).digest('hex')
}

export const safeEqual = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}
