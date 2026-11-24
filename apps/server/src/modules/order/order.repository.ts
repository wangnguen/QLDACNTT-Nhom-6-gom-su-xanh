import { In } from 'typeorm'

import { CartItem } from '@entities/cart-item.entity'
import { OrderItem } from '@entities/order-item.entity'
import { Order } from '@entities/order.entity'
import { PaymentTransaction } from '@entities/payment-transaction.entity'
import { Product } from '@entities/product.entity'

import AppDataSource from '@databases/data-source'

// Một dòng giỏ hàng đọc ra khi đang giữ khoá các sản phẩm trong giỏ
export type CheckoutLine = {
  productId: string
  quantity: number
  // Dữ liệu mới nhất (giá, tồn kho) của sản phẩm; null khi sản phẩm đã bị xoá
  product: Product | null
  categoryActive: boolean
}

export type NewOrderData = Pick<
  Order,
  | 'code'
  | 'userId'
  | 'paymentMethod'
  | 'subtotal'
  | 'shippingFee'
  | 'total'
  | 'recipientName'
  | 'recipientPhone'
  | 'shippingAddress'
  | 'note'
>

export type NewOrderItemData = Pick<
  OrderItem,
  'productId' | 'productName' | 'productSlug' | 'imageUrl' | 'unitPrice' | 'quantity' | 'lineTotal'
> & { productId: string }

export type NewTransactionData = Pick<PaymentTransaction, 'code' | 'userId' | 'method' | 'amount' | 'expiresAt'> &
  Partial<Pick<PaymentTransaction, 'type' | 'note'>>

export type CheckoutPlan = {
  order: NewOrderData
  items: NewOrderItemData[]
  // Giao dịch thanh toán trực tuyến tạo cùng đơn (không có với COD)
  payment?: NewTransactionData
}

class OrderRepository {
  static findById(id: string) {
    return this.orderRepo.findOne({ where: { id }, relations: { items: true } })
  }

  /**
   * Tạo đơn từ giỏ hàng trong một transaction có khoá các dòng sản phẩm (SELECT ... FOR UPDATE):
   * hai khách mua cùng lúc sản phẩm cuối cùng thì chỉ một người đặt được, tồn kho không bao giờ âm.
   * `build` kiểm tra nghiệp vụ (ném lỗi nếu không hợp lệ) rồi trả về dữ liệu cần lưu.
   * Đặt xong: trừ tồn kho và bỏ các sản phẩm đã đặt khỏi giỏ.
   */
  static createFromCart(
    userId: string,
    build: (lines: CheckoutLine[]) => CheckoutPlan
  ): Promise<{ order: Order; transaction: PaymentTransaction | null }> {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const cartItems = await manager.getRepository(CartItem).find({
        where: { userId },
        relations: { product: { category: true } },
        order: { createdAt: 'ASC', id: 'ASC' }
      })

      // Khoá theo thứ tự id để hai đơn khoá chéo nhau không bị deadlock
      const productIds = cartItems.filter((item) => item.product).map((item) => item.productId)
      const locked = productIds.length
        ? await manager.getRepository(Product).find({
            where: { id: In(productIds) },
            order: { id: 'ASC' },
            lock: { mode: 'pessimistic_write' }
          })
        : []
      const lockedById = new Map(locked.map((product) => [product.id, product]))

      const plan = build(
        cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          product: lockedById.get(item.productId) ?? null,
          categoryActive: item.product?.category?.isActive ?? false
        }))
      )

      const orderRepo = manager.getRepository(Order)
      const order = await orderRepo.save(orderRepo.create(plan.order))

      const itemRepo = manager.getRepository(OrderItem)
      await itemRepo.save(plan.items.map((item) => itemRepo.create({ ...item, orderId: order.id })))

      for (const item of plan.items) {
        await manager.getRepository(Product).decrement({ id: item.productId }, 'stock', item.quantity)
      }
      await manager.getRepository(CartItem).delete({ userId, productId: In(plan.items.map((item) => item.productId)) })

      let transaction: PaymentTransaction | null = null
      if (plan.payment) {
        const transactionRepo = manager.getRepository(PaymentTransaction)
        transaction = await transactionRepo.save(transactionRepo.create({ ...plan.payment, orderId: order.id }))
      }

      const saved = await orderRepo.findOneOrFail({ where: { id: order.id }, relations: { items: true } })
      return { order: saved, transaction }
    })
  }

  private static get orderRepo() {
    return AppDataSource.getDataSource().getRepository(Order)
  }
}

export default OrderRepository
