import { z } from 'zod/v4'

import { REGISTRATION_STATUS } from '@common/constants'
import { paginationQuerySchema, searchQuerySchema, uuidSchema } from '@common/validators'

const registrationStatusSchema = z.enum(REGISTRATION_STATUS, 'Trạng thái không hợp lệ')

// US-13: Lịch workshop của tôi
export const MyRegistrationQuerySchema = paginationQuerySchema.extend({
  status: registrationStatusSchema.optional(),
  // Xem mình đã đăng ký một lớp cụ thể chưa (trang chi tiết lớp)
  workshopId: uuidSchema.optional()
})

export type MyRegistrationQuery = z.infer<typeof MyRegistrationQuerySchema>

// US-13: Quản lý đăng ký (admin)
export const AdminRegistrationQuerySchema = paginationQuerySchema.extend({
  // Mã đăng ký, tên, số điện thoại hoặc email người liên hệ
  search: searchQuerySchema.optional(),
  workshopId: uuidSchema.optional(),
  status: registrationStatusSchema.optional()
})

export type AdminRegistrationQuery = z.infer<typeof AdminRegistrationQuerySchema>

export const RegistrationIdParamSchema = z.object({ id: uuidSchema })
