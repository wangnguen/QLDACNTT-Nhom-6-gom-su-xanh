import { WorkshopRegistrationItem } from '@common/types'

import { toWorkshopRef } from '@modules/workshop/workshop.mapper'

import { WorkshopRegistration } from '@entities/workshop-registration.entity'

// `registration.workshop` phải được load kèm
export const toRegistrationItem = (registration: WorkshopRegistration): WorkshopRegistrationItem => ({
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
  workshop: toWorkshopRef(registration.workshop)
})
