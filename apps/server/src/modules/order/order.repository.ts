import { Brackets, In } from 'typeorm'

import { OrderStatus, PaymentMethod, PaymentStatus } from '@common/constants'

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

export type OrderFilter = {
  userId?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  // Mã đơn, tên / số điện thoại người nhận, email tài khoản (trang admin)
  search?: string
  // Đặt trong khoảng [placedFrom, placedBefore)
  placedFrom?: Date
  placedBefore?: Date
  // Load kèm tài khoản đặt hàng (trang admin)
  withCustomer?: boolean
  limit: number
  offset: number
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

export type OrderStatusChange = Partial<
  Pick<Order, 'status' | 'paymentStatus' | 'paidAt' | 'confirmedAt' | 'cancelReason' | 'cancelledBy' | 'cancelledAt'>
>

export type OrderTransition = {
  change: OrderStatusChange
  // Trả lại tồn kho cho các sản phẩm trong đơn (huỷ đơn, hoàn hàng)
  restock?: boolean
  // Giao dịch phát sinh cùng lúc (vd yêu cầu hoàn tiền)
  transactions?: NewTransactionData[]
}

export type CheckoutPlan = {
  order: NewOrderData
  items: NewOrderItemData[]
  // Giao dịch thanh toán trực tuyến tạo cùng đơn (không có với COD)
  payment?: NewTransactionData
}

class OrderRepository {
  static findById(id: string, withCustomer = false) {
    return this.orderRepo.findOne({ where: { id }, relations: { items: true, user: withCustomer } })
  }

  // Số đơn theo từng trạng thái (tab đếm ở trang admin); trạng thái chưa có đơn không có trong Map
  static async countByStatus(): Promise<Map<OrderStatus, number>> {
    const rows = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: OrderStatus; count: number }>()
    return new Map(rows.map((row) => [row.status, row.count]))
  }

  // Mới đặt lên trước
  static findMany(filter: OrderFilter): Promise<[Order[], number]> {
    const query = this.orderRepo.createQueryBuilder('order').leftJoinAndSelect('order.items', 'item')

    if (filter.userId) query.andWhere('order.userId = :userId', { userId: filter.userId })
    if (filter.status) query.andWhere('order.status = :status', { status: filter.status })
    if (filter.paymentStatus) {
      query.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: filter.paymentStatus })
    }
    if (filter.paymentMethod) {
      query.andWhere('order.paymentMethod = :paymentMethod', { paymentMethod: filter.paymentMethod })
    }
    if (filter.placedFrom) query.andWhere('order.createdAt >= :placedFrom', { placedFrom: filter.placedFrom })
    if (filter.placedBefore) query.andWhere('order.createdAt < :placedBefore', { placedBefore: filter.placedBefore })

    if (filter.withCustomer || filter.search) query.innerJoinAndSelect('order.user', 'user')
    if (filter.search) {
      const keyword = `%${escapeLike(filter.search)}%`
      query.andWhere(
        new Brackets((where) =>
          where
            .where('order.code ILIKE :keyword', { keyword })
            .orWhere('order.recipientName ILIKE :keyword')
            .orWhere('order.recipientPhone LIKE :keyword')
            .orWhere('user.email ILIKE :keyword')
        )
      )
    }

    return query
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('order.id', 'ASC')
      .skip(filter.offset)
      .take(filter.limit)
      .getManyAndCount()
  }

  /**
   * Đổi trạng thái đơn trong một transaction có khoá dòng đơn: chỉ đổi khi đơn vẫn ở một trong `fromStatuses`
   * (khách huỷ đúng lúc cửa hàng xác nhận thì chỉ một bên thành công). `build` nhận đơn đang khoá — tình trạng
   * thanh toán đọc ra lúc này là mới nhất. Trả về false nếu trạng thái đơn đã đổi.
   */
  static transition(id: string, fromStatuses: OrderStatus[], build: (order: Order) => OrderTransition) {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order)
      const order = await orderRepo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } })
      if (!order || !fromStatuses.includes(order.status)) return false

      const { change, restock, transactions = [] } = build(order)
      await orderRepo.update(id, change)

      if (restock) {
        const items = await manager.getRepository(OrderItem).find({ where: { orderId: id } })
        for (const item of items) {
          if (item.productId) {
            await manager.getRepository(Product).increment({ id: item.productId }, 'stock', item.quantity)
          }
        }
      }

      const transactionRepo = manager.getRepository(PaymentTransaction)
      for (const data of transactions) await transactionRepo.save(transactionRepo.create({ ...data, orderId: id }))
      return true
    })
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
