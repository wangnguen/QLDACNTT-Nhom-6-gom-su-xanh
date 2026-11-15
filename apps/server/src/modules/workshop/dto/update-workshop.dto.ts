import { z } from 'zod/v4'

import { WorkshopBodyFields } from './create-workshop.dto'

// Chỉ cập nhật các trường được gửi lên; description/instructor gửi null hoặc chuỗi rỗng để xoá,
// registrationDeadline gửi null để nhận đăng ký tới giờ bắt đầu
const UpdateWorkshopBodyBaseSchema = z.object({
  name: WorkshopBodyFields.name.optional(),
  description: WorkshopBodyFields.description.nullable().optional(),
  instructor: WorkshopBodyFields.instructor.nullable().optional(),
  location: WorkshopBodyFields.location.optional(),
  startsAt: WorkshopBodyFields.startsAt.optional(),
  endsAt: WorkshopBodyFields.endsAt.optional(),
  registrationDeadline: WorkshopBodyFields.registrationDeadline.nullable().optional(),
  price: WorkshopBodyFields.price.optional(),
  capacity: WorkshopBodyFields.capacity.optional(),
  imageUrls: WorkshopBodyFields.imageUrls.optional(),
  isActive: WorkshopBodyFields.isActive.optional()
})

export const UpdateWorkshopBodyExample = {
  capacity: 15,
  registrationDeadline: null,
  isActive: false
} satisfies z.input<typeof UpdateWorkshopBodyBaseSchema>

export const UpdateWorkshopBodySchema = UpdateWorkshopBodyBaseSchema.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'Không có thông tin nào để cập nhật'
).meta({
  example: UpdateWorkshopBodyExample
})

export type UpdateWorkshopBody = z.infer<typeof UpdateWorkshopBodySchema>
