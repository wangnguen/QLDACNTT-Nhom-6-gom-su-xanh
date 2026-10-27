import { z } from 'zod/v4'

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,72}$/

export const passwordSchema = z
  .string()
  .regex(
    PASSWORD_REGEX,
    'Mật khẩu từ 8–72 ký tự, gồm chữ hoa, chữ thường, chữ số, ký tự đặc biệt và không chứa khoảng trắng'
  )
