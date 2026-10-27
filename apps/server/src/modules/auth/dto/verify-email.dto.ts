import { z } from 'zod/v4'

import { emailSchema, otpSchema } from '@common/validators'

const VerifyEmailBodyBaseSchema = z.object({
  email: emailSchema,
  otp: otpSchema
})

export const VerifyEmailBodyExample = {
  email: 'nguyenvanan@gmail.com',
  otp: '123456'
} satisfies z.input<typeof VerifyEmailBodyBaseSchema>

export const VerifyEmailBodySchema = VerifyEmailBodyBaseSchema.meta({
  example: VerifyEmailBodyExample
})

export type VerifyEmailBody = z.infer<typeof VerifyEmailBodySchema>
