import { CART_ITEM_ISSUE, CartItemIssue } from '@common/constants'
import { Cart, CartLine } from '@common/types'

import { toProductSummary } from '@modules/product/product.mapper'

import { CartItem } from '@entities/cart-item.entity'
import { Product } from '@entities/product.entity'

const getIssue = (product: Product, quantity: number): CartItemIssue | null => {
  if (!product.isActive || !product.category.isActive) return CART_ITEM_ISSUE.UNAVAILABLE
  if (product.stock === 0) return CART_ITEM_ISSUE.OUT_OF_STOCK
  if (quantity > product.stock) return CART_ITEM_ISSUE.NOT_ENOUGH_STOCK
  return null
}

// `item.product.category` phải được load kèm
const toCartLine = (item: CartItem): CartLine => ({
  productId: item.productId,
  quantity: item.quantity,
  product: toProductSummary(item.product),
  lineTotal: item.product.price * item.quantity,
  issue: getIssue(item.product, item.quantity)
})

export const toCart = (items: CartItem[]): Cart => {
  const lines = items.map(toCartLine)
  return {
    items: lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => (line.issue ? sum : sum + line.lineTotal), 0)
  }
}
