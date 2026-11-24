import {
  ADMIN_CANCELLABLE_STATUSES,
  CUSTOMER_CANCELLABLE_STATUSES,
  FREE_SHIPPING_THRESHOLD,
  ORDER_CANCELLED_BY,
  ORDER_NOT_FOUND_MESSAGE,
  ORDER_STATUS,
  OrderCancelledBy,
  OrderStatus,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SHIPMENT_ACTION,
  SHIPPING_FEE,
  TRANSACTION_STATUS
} from '@common/constants'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { AdminOrder, AdminOrderDetail, CheckoutResult, OrderDetail, Paginated } from '@common/types'
import { startOfVnDay } from '@common/utils/date'
import { generateCode } from '@common/utils/random'

import { toTransactionItem } from '@modules/payment/payment.mapper'
import PaymentRepository from '@modules/payment/payment.repository'
import PaymentService from '@modules/payment/payment.service'

import { Order } from '@entities/order.entity'

import {
  AdminOrderQuery,
  CancelOrderBody,
  CreateOrderBody,
  MyOrderQuery,
  UpdateOrderStatusBody,
  UpdateShipmentBody
} from './dto'
import { toAdminOrder, toOrderDetail } from './order.mapper'
import OrderRepository, { CheckoutLine, CheckoutPlan, NewOrderItemData, OrderTransition } from './order.repository'

// Mã đơn hàng: DH + 6 ký tự, vd DH7K3M9Q
const ORDER_CODE_PREFIX = 'DH'

// Cột tiền là integer — chặn đơn có giá trị bất thường
export const MAX_ORDER_TOTAL = 1_000_000_000

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'chờ xác nhận',
  confirmed: 'đã xác nhận',
  shipping: 'đang giao',
  delivered: 'đã giao',
  cancelled: 'đã huỷ',
  returned: 'đã hoàn hàng'
}

export const ORDER_CHANGED_MESSAGE = 'Trạng thái đơn hàng vừa thay đổi, vui lòng tải lại trang'

// Đơn từ FREE_SHIPPING_THRESHOLD trở lên được miễn phí giao hàng
export const calculateShippingFee = (subtotal: number): number =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE

// Dòng giỏ hàng mua được: sản phẩm còn bán, danh mục đang hiện và đủ tồn kho
const isPurchasable = (line: CheckoutLine): line is CheckoutLine & { product: NonNullable<CheckoutLine['product']> } =>
  !!line.product && line.product.isActive && line.categoryActive && line.product.stock >= line.quantity

class OrderService {
  /**
   * US-14: Đặt hàng từ giỏ hàng — đặt mọi sản phẩm mua được trong giỏ (sản phẩm hết hàng/ngừng bán ở lại giỏ).
   * Thanh toán VNPay thì trả kèm link chuyển sang cổng thanh toán.
   */
  static async checkout(userId: string, dto: CreateOrderBody, ipAddr: string): Promise<CheckoutResult> {
    const now = new Date()
    const { order, transaction } = await OrderRepository.createFromCart(userId, (lines) =>
      this.planCheckout(userId, dto, lines, now)
    )

    return {
      order: toOrderDetail(order),
      paymentUrl: transaction ? PaymentService.buildPaymentUrl(transaction, order, ipAddr) : null
    }
  }

  // US-15: Đơn hàng của tôi — mới đặt lên trước
  static async listMine(userId: string, query: MyOrderQuery): Promise<Paginated<OrderDetail>> {
    const [orders, total] = await OrderRepository.findMany({ ...query, userId })
    return { limit: query.limit, offset: query.offset, total_count: total, entries: orders.map(toOrderDetail) }
  }

  // US-15: Chi tiết đơn hàng — đơn của người khác báo không tìm thấy để không lộ thông tin
  static async getMine(userId: string, id: string): Promise<OrderDetail> {
    return toOrderDetail(await this.findOwnOrThrow(userId, id))
  }

  // US-16: Khách tự huỷ đơn còn chờ xác nhận — trả lại tồn kho; đơn đã thanh toán thì chờ cửa hàng hoàn tiền
  static async cancelMine(userId: string, id: string, { reason }: CancelOrderBody): Promise<OrderDetail> {
    const order = await this.findOwnOrThrow(userId, id)
    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
      throw new BadRequestError(
        order.status === ORDER_STATUS.CONFIRMED
          ? 'Đơn hàng đã được cửa hàng xác nhận, vui lòng liên hệ cửa hàng nếu muốn huỷ'
          : `Đơn hàng đang ở trạng thái "${ORDER_STATUS_LABEL[order.status]}", không thể huỷ`
      )
    }
    return this.cancel(order, CUSTOMER_CANCELLABLE_STATUSES, ORDER_CANCELLED_BY.USER, reason)
  }

  /**
   * Huỷ đơn (khách hoặc cửa hàng): trả lại tồn kho; nếu đơn đã thanh toán thì chuyển sang chờ hoàn tiền và
   * tạo giao dịch hoàn tiền để cửa hàng xử lý (US-20).
   */
  static async cancel(
    order: Order,
    fromStatuses: OrderStatus[],
    cancelledBy: OrderCancelledBy,
    reason: string | null
  ): Promise<OrderDetail> {
    const changed = await OrderRepository.transition(order.id, fromStatuses, (locked): OrderTransition => {
      const paid = locked.paymentStatus === PAYMENT_STATUS.PAID
      return {
        change: {
          status: ORDER_STATUS.CANCELLED,
          cancelReason: reason,
          cancelledBy,
          cancelledAt: new Date(),
          ...(paid && { paymentStatus: PAYMENT_STATUS.REFUND_PENDING })
        },
        restock: true,
        transactions: paid
          ? [
              PaymentService.newRefund(
                locked,
                cancelledBy === ORDER_CANCELLED_BY.USER
                  ? 'Khách huỷ đơn đã thanh toán'
                  : 'Cửa hàng huỷ đơn đã thanh toán'
              )
            ]
          : []
      }
    })
    return this.reloadAfterChange(order.id, changed)
  }

  // US-18: Danh sách đơn ở trang admin, kèm tài khoản đặt hàng
  static async listForAdmin({ from, to, ...query }: AdminOrderQuery): Promise<Paginated<AdminOrder>> {
    const [orders, total] = await OrderRepository.findMany({
      ...query,
      placedFrom: from ? startOfVnDay(from) : undefined,
      placedBefore: to ? startOfVnDay(to, 1) : undefined,
      withCustomer: true
    })
    return { limit: query.limit, offset: query.offset, total_count: total, entries: orders.map(toAdminOrder) }
  }

  // US-18: Số đơn theo từng trạng thái (đủ mọi trạng thái, chưa có đơn thì là 0)
  static async countByStatus(): Promise<Record<OrderStatus, number>> {
    const counts = await OrderRepository.countByStatus()
    return Object.fromEntries(Object.values(ORDER_STATUS).map((status) => [status, counts.get(status) ?? 0])) as Record<
      OrderStatus,
      number
    >
  }

  // US-18: Chi tiết đơn ở trang admin — kèm mọi lượt thanh toán / hoàn tiền
  static async getForAdmin(id: string): Promise<AdminOrderDetail> {
    const order = await OrderRepository.findById(id, true)
    if (!order) throw new NotFoundError(ORDER_NOT_FOUND_MESSAGE)

    const [transactions] = await PaymentRepository.findMany({ orderId: id, limit: 100, offset: 0 })
    return { ...toAdminOrder(order), transactions: transactions.map((t) => toTransactionItem(t)) }
  }

  /**
   * US-18: Cửa hàng xác nhận đơn (đơn VNPay phải thanh toán xong) hoặc huỷ đơn chưa giao, kèm lý do khách thấy.
   * Huỷ đơn đã thanh toán thì chuyển sang chờ hoàn tiền giống khách tự huỷ.
   */
  static async updateStatusByAdmin(
    id: string,
    { status, cancelReason }: UpdateOrderStatusBody
  ): Promise<AdminOrderDetail> {
    const order = await OrderRepository.findById(id)
    if (!order) throw new NotFoundError(ORDER_NOT_FOUND_MESSAGE)

    if (status === ORDER_STATUS.CANCELLED) {
      this.ensureStatus(order, ADMIN_CANCELLABLE_STATUSES, 'huỷ')
      await this.cancel(order, ADMIN_CANCELLABLE_STATUSES, ORDER_CANCELLED_BY.ADMIN, cancelReason ?? null)
      return this.getForAdmin(id)
    }

    this.ensureStatus(order, [ORDER_STATUS.PENDING], 'xác nhận')
    const ensurePaid = (target: Order) => {
      if (target.paymentMethod === PAYMENT_METHOD.VNPAY && target.paymentStatus !== PAYMENT_STATUS.PAID) {
        throw new BadRequestError('Đơn thanh toán trực tuyến chưa được thanh toán, chưa thể xác nhận')
      }
    }
    ensurePaid(order)
    const changed = await OrderRepository.transition(id, [ORDER_STATUS.PENDING], (locked) => {
      ensurePaid(locked)
      return { change: { status: ORDER_STATUS.CONFIRMED, confirmedAt: new Date() } }
    })
    if (!changed) throw new ConflictError(ORDER_CHANGED_MESSAGE)
    return this.getForAdmin(id)
  }

  /**
   * US-19: Quản lý vận chuyển
   * - ship: đơn đã xác nhận giao cho đơn vị vận chuyển (kèm mã vận đơn) → đang giao
   * - update: sửa đơn vị vận chuyển / mã vận đơn khi đang giao
   * - deliver: giao thành công → đã giao; đơn COD ghi nhận đã thu tiền (một giao dịch thành công)
   * - return: giao không thành công → hoàn hàng: trả lại tồn kho, đơn đã thanh toán chuyển sang chờ hoàn tiền
   */
  static async updateShipment(id: string, body: UpdateShipmentBody): Promise<AdminOrderDetail> {
    const order = await OrderRepository.findById(id)
    if (!order) throw new NotFoundError(ORDER_NOT_FOUND_MESSAGE)

    const now = new Date()
    let from: OrderStatus[]
    let build: (locked: Order) => OrderTransition

    switch (body.action) {
      case SHIPMENT_ACTION.SHIP:
        from = [ORDER_STATUS.CONFIRMED]
        this.ensureStatus(order, from, 'giao cho đơn vị vận chuyển')
        build = () => ({
          change: {
            status: ORDER_STATUS.SHIPPING,
            shippingCarrier: body.shippingCarrier,
            trackingCode: body.trackingCode ?? null,
            shippedAt: now
          }
        })
        break
      case SHIPMENT_ACTION.UPDATE:
        from = [ORDER_STATUS.SHIPPING]
        this.ensureStatus(order, from, 'sửa thông tin vận chuyển')
        build = () => ({
          change: { shippingCarrier: body.shippingCarrier, trackingCode: body.trackingCode ?? null }
        })
        break
      case SHIPMENT_ACTION.DELIVER:
        from = [ORDER_STATUS.SHIPPING]
        this.ensureStatus(order, from, 'xác nhận đã giao')
        build = (locked) => {
          const collectCash =
            locked.paymentMethod === PAYMENT_METHOD.COD && locked.paymentStatus === PAYMENT_STATUS.UNPAID
          return {
            change: {
              status: ORDER_STATUS.DELIVERED,
              deliveredAt: now,
              ...(collectCash && { paymentStatus: PAYMENT_STATUS.PAID, paidAt: now })
            },
            transactions: collectCash
              ? [
                  {
                    ...PaymentService.newCodPayment(locked),
                    status: TRANSACTION_STATUS.SUCCESS,
                    completedAt: now
                  }
                ]
              : []
          }
        }
        break
      case SHIPMENT_ACTION.RETURN:
        from = [ORDER_STATUS.SHIPPING]
        this.ensureStatus(order, from, 'ghi nhận hoàn hàng')
        build = (locked) => {
          const paid = locked.paymentStatus === PAYMENT_STATUS.PAID
          return {
            change: {
              status: ORDER_STATUS.RETURNED,
              returnedAt: now,
              deliveryNote: body.reason,
              ...(paid && { paymentStatus: PAYMENT_STATUS.REFUND_PENDING })
            },
            restock: true,
            transactions: paid ? [PaymentService.newRefund(locked, `Giao không thành công: ${body.reason}`)] : []
          }
        }
        break
    }

    const changed = await OrderRepository.transition(id, from, build)
    if (!changed) throw new ConflictError(ORDER_CHANGED_MESSAGE)
    return this.getForAdmin(id)
  }

  static ensureStatus(order: Order, allowed: OrderStatus[], action: string) {
    if (allowed.includes(order.status)) return
    if (order.status === ORDER_STATUS.CONFIRMED && action === 'xác nhận') {
      throw new BadRequestError('Đơn hàng đã được xác nhận trước đó')
    }
    throw new BadRequestError(`Đơn hàng đang ở trạng thái "${ORDER_STATUS_LABEL[order.status]}", không thể ${action}`)
  }

  // Trạng thái có thể vừa bị bên kia đổi → báo tải lại thay vì ghi đè
  static async reloadAfterChange(id: string, changed: boolean): Promise<OrderDetail> {
    if (!changed) throw new ConflictError(ORDER_CHANGED_MESSAGE)
    const updated = await OrderRepository.findById(id)
    return toOrderDetail(updated!)
  }

  static async findOwnOrThrow(userId: string, id: string) {
    const order = await OrderRepository.findById(id)
    if (!order || order.userId !== userId) throw new NotFoundError(ORDER_NOT_FOUND_MESSAGE)
    return order
  }

  // Kiểm tra giỏ hàng (đang giữ khoá) và tính tiền — ném lỗi nếu không đặt được
  static planCheckout(userId: string, dto: CreateOrderBody, lines: CheckoutLine[], now = new Date()): CheckoutPlan {
    if (lines.length === 0) throw new BadRequestError('Giỏ hàng đang trống')

    const purchasable = lines.filter(isPurchasable)
    if (purchasable.length === 0) {
      throw new BadRequestError('Các sản phẩm trong giỏ hiện không mua được (ngừng bán hoặc không đủ hàng)')
    }

    const items: NewOrderItemData[] = purchasable.map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.imageUrls[0] ?? null,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity
    }))

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const shippingFee = calculateShippingFee(subtotal)
    const total = subtotal + shippingFee
    if (total > MAX_ORDER_TOTAL) {
      throw new BadRequestError('Giá trị đơn hàng quá lớn, vui lòng liên hệ cửa hàng để được hỗ trợ')
    }

    return {
      order: {
        code: generateCode(ORDER_CODE_PREFIX),
        userId,
        paymentMethod: dto.paymentMethod,
        subtotal,
        shippingFee,
        total,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        shippingAddress: dto.shippingAddress,
        note: dto.note ?? null
      },
      items,
      payment:
        dto.paymentMethod === PAYMENT_METHOD.VNPAY ? PaymentService.newOnlinePayment(userId, total, now) : undefined
    }
  }
}

export default OrderService
