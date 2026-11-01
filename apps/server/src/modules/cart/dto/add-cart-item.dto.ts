import { z } from 'zod/v4'

import { MAX_CART_ITEM_QUANTITY } from '@common/constants'
import { uuidSchema } from '@common/validators'

export const cartQuantitySchema = z
  .number('Số lượng phải là số')
  .int('Số lượng phải là số nguyên')
  .min(1, 'Số lượng tối thiểu là 1')
  .max(MAX_CART_ITEM_QUANTITY, `Mỗi sản phẩm chỉ mua tối đa ${MAX_CART_ITEM_QUANTITY}`)

export const CartProductParamSchema = z.object({ productId: uuidSchema })

const AddCartItemBodyBaseSchema = z.object({
  productId: z.uuid('Sản phẩm không hợp lệ'),
  quantity: cartQuantitySchema.default(1)
})

export const AddCartItemBodyExample = {
  productId: '9f1e2d3c-4b5a-4678-9abc-def012345678',
  quantity: 2
} satisfies z.input<typeof AddCartItemBodyBaseSchema>

export const AddCartItemBodySchema = AddCartItemBodyBaseSchema.meta({
  example: AddCartItemBodyExample
})

export type AddCartItemBody = z.infer<typeof AddCartItemBodySchema>
