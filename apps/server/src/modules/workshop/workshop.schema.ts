import { z } from 'zod/v4'

export const WorkshopBody = z
  .object({
    name: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1).max(10000),
    artisan: z.string().trim().min(1).max(255),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    capacity: z.number().int().min(1).max(10000),
    status: z.enum(['open', 'hidden', 'cancelled']).default('open')
  })
  .refine((v) => Date.parse(v.endsAt) > Date.parse(v.startsAt), {
    message: 'Giờ kết thúc phải sau giờ bắt đầu',
    path: ['endsAt']
  })

export const RegistrationBody = z.object({ seats: z.number().int().min(1).max(10000) })
export const RegistrationStatusBody = z.object({ status: z.literal('cancelled') })
export type WorkshopInput = z.infer<typeof WorkshopBody>
