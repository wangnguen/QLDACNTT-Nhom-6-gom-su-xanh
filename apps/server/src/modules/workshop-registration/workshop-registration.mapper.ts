import { CANCELLABLE_STATUSES, REGISTRATION_CANCEL_BEFORE_HOURS } from '@common/constants'
import { WorkshopRegistrationItem } from '@common/types'

import { toWorkshopRef } from '@modules/workshop/workshop.mapper'

import { WorkshopRegistration } from '@entities/workshop-registration.entity'

// Khách tự huỷ được tới trước giờ học REGISTRATION_CANCEL_BEFORE_HOURS tiếng
export const getCancellableUntil = (registration: WorkshopRegistration): Date =>
  new Date(registration.workshop.startsAt.getTime() - REGISTRATION_CANCEL_BEFORE_HOURS * 60 * 60 * 1000)

// `registration.workshop` phải được load kèm
export const toRegistrationItem = (registration: WorkshopRegistration, now = new Date()): WorkshopRegistrationItem => {
  const cancellableUntil = getCancellableUntil(registration)
  return {
    id: registration.id,
    code: registration.code,
    seats: registration.seats,
    unitPrice: registration.unitPrice,
    totalPrice: registration.totalPrice,
    contactName: registration.contactName,
    contactPhone: registration.contactPhone,
    contactEmail: registration.contactEmail,
    note: registration.note,
    status: registration.status,
    cancelReason: registration.cancelReason,
    cancelledBy: registration.cancelledBy,
    cancelledAt: registration.cancelledAt,
    registeredAt: registration.createdAt,
    cancellableUntil,
    canCancel: CANCELLABLE_STATUSES.includes(registration.status) && now.getTime() < cancellableUntil.getTime(),
    workshop: toWorkshopRef(registration.workshop)
  }
}
