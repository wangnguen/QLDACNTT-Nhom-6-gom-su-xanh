import { z } from 'zod/v4'

import { emailSchema } from '@common/validators'

const ResendVerificationBodyBaseSchema = z.object({
  email: emailSchema
})

export const ResendVerificationBodyExample = {
  email: 'nguyenvanan@gmail.com'
} satisfies z.input<typeof ResendVerificationBodyBaseSchema>

export const ResendVerificationBodySchema = ResendVerificationBodyBaseSchema.meta({
  example: ResendVerificationBodyExample
})

export type ResendVerificationBody = z.infer<typeof ResendVerificationBodySchema>
