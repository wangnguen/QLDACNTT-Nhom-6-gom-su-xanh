import { z } from 'zod/v4'

import { OTP_LENGTH } from '@common/constants'

export const PHONE_REGEX = /^0\d{9}$/

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ').max(255))

export const phoneSchema = z.string().trim().regex(PHONE_REGEX, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0')

export const fullNameSchema = z.string().trim().min(1, 'Vui lòng nhập họ và tên').max(255, 'Họ tên tối đa 255 ký tự')

export const otpSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Mã OTP gồm ${OTP_LENGTH} chữ số`)
