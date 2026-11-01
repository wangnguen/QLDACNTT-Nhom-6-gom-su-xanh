import { z } from 'zod/v4'

import { cartQuantitySchema } from './add-cart-item.dto'

const UpdateCartItemBodyBaseSchema = z.object({
  quantity: cartQuantitySchema
})

export const UpdateCartItemBodyExample = {
  quantity: 3
} satisfies z.input<typeof UpdateCartItemBodyBaseSchema>

export const UpdateCartItemBodySchema = UpdateCartItemBodyBaseSchema.meta({
  example: UpdateCartItemBodyExample
})

export type UpdateCartItemBody = z.infer<typeof UpdateCartItemBodySchema>
