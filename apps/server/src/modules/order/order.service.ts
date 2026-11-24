import { FREE_SHIPPING_THRESHOLD, ORDER_NOT_FOUND_MESSAGE, PAYMENT_METHOD, SHIPPING_FEE } from '@common/constants'
import { BadRequestError, NotFoundError } from '@common/errors'
import { CheckoutResult, OrderDetail, Paginated } from '@common/types'
import { generateCode } from '@common/utils/random'

import PaymentService from '@modules/payment/payment.service'

import { CreateOrderBody, MyOrderQuery } from './dto'
import { toOrderDetail } from './order.mapper'
import OrderRepository, { CheckoutLine, CheckoutPlan, NewOrderItemData } from './order.repository'

// Mã đơn hàng: DH + 6 ký tự, vd DH7K3M9Q
const ORDER_CODE_PREFIX = 'DH'

// Cột tiền là integer — chặn đơn có giá trị bất thường
export const MAX_ORDER_TOTAL = 1_000_000_000

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
