import { z } from 'zod/v4'

import { otpSchema } from '@common/validators'

const VerifyChangeEmailBodyBaseSchema = z.object({
  otp: otpSchema
})

export const VerifyChangeEmailBodyExample = {
  otp: '123456'
} satisfies z.input<typeof VerifyChangeEmailBodyBaseSchema>

export const VerifyChangeEmailBodySchema = VerifyChangeEmailBodyBaseSchema.meta({
  example: VerifyChangeEmailBodyExample
})

export type VerifyChangeEmailBody = z.infer<typeof VerifyChangeEmailBodySchema>
