import { WorkshopDetail, WorkshopSummary } from '@common/types'

import { Workshop } from '@entities/workshop.entity'

export const toWorkshopSummary = (workshop: Workshop): WorkshopSummary => ({
  id: workshop.id,
  name: workshop.name,
  slug: workshop.slug,
  imageUrl: workshop.imageUrls[0] ?? null,
  instructor: workshop.instructor,
  location: workshop.location,
  startsAt: workshop.startsAt,
  endsAt: workshop.endsAt,
  registrationClosesAt: workshop.registrationDeadline ?? workshop.startsAt,
  price: workshop.price,
  capacity: workshop.capacity,
  isActive: workshop.isActive
})

export const toWorkshopDetail = (workshop: Workshop): WorkshopDetail => ({
  ...toWorkshopSummary(workshop),
  description: workshop.description,
  registrationDeadline: workshop.registrationDeadline,
  imageUrls: workshop.imageUrls
})
