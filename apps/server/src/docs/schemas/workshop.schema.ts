import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { idParamSchema } from '@common/validators'

import { WorkshopBody, RegistrationBody, RegistrationStatusBody } from '@modules/workshop/workshop.schema'

import {
  jsonBody,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse,
  badRequestResponse,
  notFoundResponse
} from './shared'

const row = z.object({
  id: z.uuid(),
  name: z.string(),
  content: z.string(),
  artisan: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  capacity: z.number(),
  status: z.string(),
  booked: z.number().optional(),
  remaining: z.number().optional()
})
const registration = z.object({
  id: z.uuid(),
  workshop_id: z.uuid(),
  user_id: z.uuid(),
  seats: z.number(),
  status: z.string()
})
const routes = [
  {
    method: 'get',
    path: '/workshops',
    summary: 'Lớp mở, chưa bắt đầu; chỗ còn lại tính từ đăng ký confirmed',
    schema: z.array(row)
  },
  {
    method: 'post',
    path: '/workshops/{id}/registrations',
    summary: 'Đăng ký; cùng số chỗ trả bản ghi cũ, khác số chỗ trả 409; khóa lớp tránh vượt sức chứa',
    schema: registration,
    body: RegistrationBody,
    params: true,
    secured: true
  },
  {
    method: 'get',
    path: '/admin/workshops',
    summary: 'Admin xem mọi lớp, kể cả hủy/ẩn',
    schema: z.array(row),
    secured: true
  },
  {
    method: 'post',
    path: '/admin/workshops',
    summary: 'Admin tạo lớp; timestamp ISO có offset, UI dùng UTC+7',
    schema: row,
    body: WorkshopBody,
    secured: true
  },
  {
    method: 'patch',
    path: '/admin/workshops/{id}',
    summary: 'Admin sửa toàn bộ lớp; không đổi lịch khi có đăng ký, không mở lại lớp hủy',
    schema: row,
    body: WorkshopBody,
    params: true,
    secured: true
  },
  {
    method: 'get',
    path: '/admin/workshop-registrations',
    summary: 'Admin tìm đăng ký theo workshopId UUID, search tên/email/phone, status confirmed/cancelled',
    schema: z.array(registration),
    secured: true
  },
  {
    method: 'patch',
    path: '/admin/workshop-registrations/{id}',
    summary: 'Admin hủy đăng ký idempotent, trả chỗ đúng một lần',
    schema: registration,
    body: RegistrationStatusBody,
    params: true,
    secured: true
  }
] as const
for (const r of routes)
  registry.registerPath({
    method: r.method,
    path: r.path,
    tags: ['Workshop (SCRUM-28–30)'],
    summary: r.summary,
    security: 'secured' in r ? [{ bearerAuth: [] }] : undefined,
    request: { ...('body' in r ? jsonBody(r.body) : {}), ...('params' in r ? { params: idParamSchema } : {}) },
    responses: {
      [r.method === 'post' && r.path === '/admin/workshops' ? 201 : 200]: {
        description: 'Thành công',
        content: { 'application/json': { schema: successWrapper(r.schema, r.path) } }
      },
      400: badRequestResponse('Lịch phải ở tương lai'),
      401: unauthorizedResponse('Chưa đăng nhập'),
      403: { description: 'Chỉ admin' },
      404: notFoundResponse('Không tìm thấy lớp/đăng ký'),
      409: { description: 'Không đủ chỗ, lớp đóng hoặc xung đột đăng ký/lịch/sức chứa' },
      422: validationErrorResponse()
    }
  })
