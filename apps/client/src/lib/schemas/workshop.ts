import { z } from 'zod'
import { fullNameField, phoneField } from './auth'

// Khớp với server (US-12)
export const MAX_SEATS_PER_REGISTRATION = 10

export const registrationSchema = z.object({
  seats: z.number().int().min(1, 'Đặt ít nhất 1 chỗ'),
  contactName: fullNameField,
  contactPhone: phoneField,
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự')
})

export type RegistrationInput = z.infer<typeof registrationSchema>
