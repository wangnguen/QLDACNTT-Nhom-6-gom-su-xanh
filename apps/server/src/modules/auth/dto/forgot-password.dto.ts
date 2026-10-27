import { z } from 'zod/v4'

import { emailSchema } from '@common/validators'

const ForgotPasswordBodyBaseSchema = z.object({
  email: emailSchema
})

export const ForgotPasswordBodyExample = {
  email: 'nguyenvanan@gmail.com'
} satisfies z.input<typeof ForgotPasswordBodyBaseSchema>

export const ForgotPasswordBodySchema = ForgotPasswordBodyBaseSchema.meta({
  example: ForgotPasswordBodyExample
})

export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBodySchema>
