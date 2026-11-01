export const MAX_CART_ITEM_QUANTITY = 99
export const MAX_CART_ITEMS = 50

// Vấn đề của một dòng trong giỏ khiến chưa đặt mua được
export const CART_ITEM_ISSUE = {
  UNAVAILABLE: 'unavailable',
  OUT_OF_STOCK: 'out_of_stock',
  NOT_ENOUGH_STOCK: 'not_enough_stock'
} as const

export type CartItemIssue = (typeof CART_ITEM_ISSUE)[keyof typeof CART_ITEM_ISSUE]
