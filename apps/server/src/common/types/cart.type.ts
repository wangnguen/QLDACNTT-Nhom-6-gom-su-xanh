import { CartItemIssue } from '@common/constants'

import { ProductSummary } from './product.type'

export type CartLine = {
  productId: string
  quantity: number
  product: ProductSummary
  // Giá hiện tại × số lượng
  lineTotal: number
  // null = mua được; có giá trị = sản phẩm ngừng bán / hết hàng / không đủ hàng
  issue: CartItemIssue | null
}

export type Cart = {
  items: CartLine[]
  // Tổng số lượng mọi dòng (số hiện trên biểu tượng giỏ hàng)
  totalQuantity: number
  // Tạm tính, chỉ cộng các dòng mua được
  subtotal: number
}
