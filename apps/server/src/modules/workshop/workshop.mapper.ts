import { WORKSHOP_AVAILABILITY, WorkshopAvailability } from '@common/constants'
import { WorkshopDetail, WorkshopRef, WorkshopSummary } from '@common/types'

import { Workshop } from '@entities/workshop.entity'

// Hạn đăng ký admin đặt, không đặt thì nhận đăng ký tới giờ bắt đầu
export const getRegistrationClosesAt = (workshop: Workshop): Date => workshop.registrationDeadline ?? workshop.startsAt

export const getAvailability = (workshop: Workshop, seatsLeft: number, now = new Date()): WorkshopAvailability => {
  if (now.getTime() >= getRegistrationClosesAt(workshop).getTime()) return WORKSHOP_AVAILABILITY.CLOSED
  if (seatsLeft <= 0) return WORKSHOP_AVAILABILITY.FULL
  return WORKSHOP_AVAILABILITY.OPEN
}

// `bookedSeats`: tổng số chỗ của các đăng ký chưa huỷ
export const toWorkshopSummary = (workshop: Workshop, bookedSeats: number): WorkshopSummary => {
  const seatsLeft = Math.max(0, workshop.capacity - bookedSeats)
  return {
    id: workshop.id,
    name: workshop.name,
    slug: workshop.slug,
    imageUrl: workshop.imageUrls[0] ?? null,
    instructor: workshop.instructor,
    location: workshop.location,
    startsAt: workshop.startsAt,
    endsAt: workshop.endsAt,
    registrationClosesAt: getRegistrationClosesAt(workshop),
    price: workshop.price,
    capacity: workshop.capacity,
    bookedSeats,
    seatsLeft,
    availability: getAvailability(workshop, seatsLeft),
    isActive: workshop.isActive
  }
}

export const toWorkshopDetail = (workshop: Workshop, bookedSeats: number): WorkshopDetail => ({
  ...toWorkshopSummary(workshop, bookedSeats),
  description: workshop.description,
  registrationDeadline: workshop.registrationDeadline,
  imageUrls: workshop.imageUrls
})

export const toWorkshopRef = (workshop: Workshop): WorkshopRef => ({
  id: workshop.id,
  name: workshop.name,
  slug: workshop.slug,
  imageUrl: workshop.imageUrls[0] ?? null,
  location: workshop.location,
  startsAt: workshop.startsAt,
  endsAt: workshop.endsAt
})
