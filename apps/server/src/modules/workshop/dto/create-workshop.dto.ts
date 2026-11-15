import { z } from 'zod/v4'

import { MAX_WORKSHOP_CAPACITY, MAX_WORKSHOP_IMAGES, MAX_WORKSHOP_PRICE } from '@common/constants'
import { catalogNameSchema, imageUrlSchema, optionalTextSchema } from '@common/validators'

// Thời điểm dạng ISO 8601 có múi giờ, vd 2026-12-05T09:00:00+07:00 hoặc 2026-12-05T02:00:00.000Z
const dateTimeSchema = (label: string) =>
  z.iso
    .datetime({ offset: true, error: `${label} phải là thời điểm ISO 8601, vd 2026-12-05T09:00:00+07:00` })
    .transform((value) => new Date(value))

export const WorkshopBodyFields = {
  name: catalogNameSchema('Tên lớp', 255),
  description: optionalTextSchema('Mô tả', 5000),
  instructor: optionalTextSchema('Người hướng dẫn', 100),
  location: z
    .string('Vui lòng nhập địa điểm')
    .trim()
    .min(1, 'Vui lòng nhập địa điểm')
    .max(255, 'Địa điểm tối đa 255 ký tự'),
  startsAt: dateTimeSchema('Thời gian bắt đầu'),
  endsAt: dateTimeSchema('Thời gian kết thúc'),
  registrationDeadline: dateTimeSchema('Hạn đăng ký'),
  price: z
    .number('Học phí phải là số')
    .int('Học phí phải là số nguyên')
    .min(0, 'Học phí không được âm')
    .max(MAX_WORKSHOP_PRICE, 'Học phí quá lớn'),
  capacity: z
    .number('Số chỗ phải là số')
    .int('Số chỗ phải là số nguyên')
    .min(1, 'Lớp phải có ít nhất 1 chỗ')
    .max(MAX_WORKSHOP_CAPACITY, `Mỗi lớp tối đa ${MAX_WORKSHOP_CAPACITY} chỗ`),
  imageUrls: z
    .array(imageUrlSchema)
    .max(MAX_WORKSHOP_IMAGES, `Tối đa ${MAX_WORKSHOP_IMAGES} ảnh`)
    .refine((urls) => new Set(urls).size === urls.length, 'Có link ảnh bị trùng'),
  isActive: z.boolean('Trạng thái hiển thị không hợp lệ')
}

// Kiểm tra thứ tự thời gian (kết thúc sau bắt đầu, hạn đăng ký...) nằm ở service vì khi sửa cần so với giá trị cũ
const CreateWorkshopBodyBaseSchema = z.object({
  name: WorkshopBodyFields.name,
  description: WorkshopBodyFields.description.nullable().optional(),
  instructor: WorkshopBodyFields.instructor.nullable().optional(),
  location: WorkshopBodyFields.location,
  startsAt: WorkshopBodyFields.startsAt,
  endsAt: WorkshopBodyFields.endsAt,
  registrationDeadline: WorkshopBodyFields.registrationDeadline.nullable().optional(),
  price: WorkshopBodyFields.price,
  capacity: WorkshopBodyFields.capacity,
  imageUrls: WorkshopBodyFields.imageUrls.default([]),
  isActive: WorkshopBodyFields.isActive.default(true)
})

export const CreateWorkshopBodyExample = {
  name: 'Lớp vuốt gốm trên bàn xoay cơ bản',
  description: 'Làm quen với đất sét, định tâm và vuốt một chiếc cốc hoặc bát nhỏ cùng nghệ nhân.',
  instructor: 'Nghệ nhân Lê Văn Thành',
  location: 'Xưởng Gốm Sứ Xanh, 12 Bát Tràng, Gia Lâm, Hà Nội',
  startsAt: '2026-12-05T09:00:00+07:00',
  endsAt: '2026-12-05T11:30:00+07:00',
  registrationDeadline: '2026-12-04T20:00:00+07:00',
  price: 350000,
  capacity: 12,
  imageUrls: ['https://example.com/images/lop-vuot-gom-1.jpg'],
  isActive: true
} satisfies z.input<typeof CreateWorkshopBodyBaseSchema>

export const CreateWorkshopBodySchema = CreateWorkshopBodyBaseSchema.meta({
  example: CreateWorkshopBodyExample
})

export type CreateWorkshopBody = z.infer<typeof CreateWorkshopBodySchema>
