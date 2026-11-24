import {
  ORDER_STATUS,
  PaymentMethod,
  REGISTRATION_STATUS,
  StatsGroupBy,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE
} from '@common/constants'

import { OrderItem } from '@entities/order-item.entity'
import { Order } from '@entities/order.entity'
import { PaymentTransaction } from '@entities/payment-transaction.entity'
import { WorkshopRegistration } from '@entities/workshop-registration.entity'

import AppDataSource from '@databases/data-source'

// Khoảng thời gian [start, end)
export type Range = { start: Date; end: Date }

// Nhãn kỳ theo giờ Việt Nam: ngày 'YYYY-MM-DD' hoặc tháng 'YYYY-MM'
const periodExpr = (column: string, groupBy: StatsGroupBy) =>
  `to_char(timezone('Asia/Ho_Chi_Minh', ${column}), '${groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'}')`

const toNumber = (value: string | number | null | undefined) => Number(value ?? 0)

class StatsRepository {
  // Doanh thu và số đơn giao thành công trong kỳ
  static async deliveredTotals({ start, end }: Range): Promise<{ revenue: number; orders: number }> {
    const row = await this.orderRepo
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)::bigint', 'revenue')
      .addSelect('COUNT(*)::int', 'orders')
      .where('order.status = :status', { status: ORDER_STATUS.DELIVERED })
      .andWhere('order.deliveredAt >= :start AND order.deliveredAt < :end', { start, end })
      .getRawOne<{ revenue: string; orders: number }>()
    return { revenue: toNumber(row?.revenue), orders: row?.orders ?? 0 }
  }

  static async countPlaced({ start, end }: Range): Promise<number> {
    return this.orderRepo
      .createQueryBuilder('order')
      .where('order.createdAt >= :start AND order.createdAt < :end', { start, end })
      .getCount()
  }

  static async countCancelled({ start, end }: Range): Promise<number> {
    return this.orderRepo
      .createQueryBuilder('order')
      .where('order.status = :status', { status: ORDER_STATUS.CANCELLED })
      .andWhere('order.cancelledAt >= :start AND order.cancelledAt < :end', { start, end })
      .getCount()
  }

  static async refundedAmount({ start, end }: Range): Promise<number> {
    const row = await AppDataSource.getDataSource()
      .getRepository(PaymentTransaction)
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)::bigint', 'amount')
      .where('transaction.type = :type', { type: TRANSACTION_TYPE.REFUND })
      .andWhere('transaction.status = :status', { status: TRANSACTION_STATUS.SUCCESS })
      .andWhere('transaction.completedAt >= :start AND transaction.completedAt < :end', { start, end })
      .getRawOne<{ amount: string }>()
    return toNumber(row?.amount)
  }

  // Học phí các lượt đã tham gia lớp diễn ra trong kỳ
  static async workshopRevenue({ start, end }: Range): Promise<number> {
    const row = await AppDataSource.getDataSource()
      .getRepository(WorkshopRegistration)
      .createQueryBuilder('registration')
      .innerJoin('registration.workshop', 'workshop')
      .select('COALESCE(SUM(registration.totalPrice), 0)::bigint', 'amount')
      .where('registration.status = :status', { status: REGISTRATION_STATUS.ATTENDED })
      .andWhere('workshop.startsAt >= :start AND workshop.startsAt < :end', { start, end })
      .getRawOne<{ amount: string }>()
    return toNumber(row?.amount)
  }

  // Doanh thu theo từng ngày / tháng (chỉ các kỳ có đơn)
  static async revenueSeries({ start, end }: Range, groupBy: StatsGroupBy) {
    const period = periodExpr('order.delivered_at', groupBy)
    const rows = await this.orderRepo
      .createQueryBuilder('order')
      .select(period, 'period')
      .addSelect('COALESCE(SUM(order.total), 0)::bigint', 'revenue')
      .addSelect('COUNT(*)::int', 'orders')
      .where('order.status = :status', { status: ORDER_STATUS.DELIVERED })
      .andWhere('order.deliveredAt >= :start AND order.deliveredAt < :end', { start, end })
      .groupBy(period)
      .getRawMany<{ period: string; revenue: string; orders: number }>()
    return rows.map((row) => ({ period: row.period, revenue: toNumber(row.revenue), orders: row.orders }))
  }

  // Sản phẩm bán chạy theo doanh thu (tiền hàng, không gồm phí giao) trong các đơn đã giao
  static async topProducts({ start, end }: Range, limit: number) {
    const rows = await AppDataSource.getDataSource()
      .getRepository(OrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('item.productId', 'productId')
      .addSelect('MAX(item.productName)', 'name')
      .addSelect('MAX(item.productSlug)', 'slug')
      .addSelect('MAX(item.imageUrl)', 'imageUrl')
      .addSelect('SUM(item.quantity)::int', 'quantity')
      .addSelect('SUM(item.lineTotal)::bigint', 'revenue')
      .where('order.status = :status', { status: ORDER_STATUS.DELIVERED })
      .andWhere('order.deliveredAt >= :start AND order.deliveredAt < :end', { start, end })
      .groupBy('item.productId')
      .orderBy('revenue', 'DESC')
      .addOrderBy('quantity', 'DESC')
      .limit(limit)
      .getRawMany<{
        productId: string | null
        name: string
        slug: string
        imageUrl: string | null
        quantity: number
        revenue: string
      }>()
    return rows.map((row) => ({ ...row, revenue: toNumber(row.revenue) }))
  }

  static async revenueByPaymentMethod({ start, end }: Range) {
    const rows = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.paymentMethod', 'method')
      .addSelect('COALESCE(SUM(order.total), 0)::bigint', 'revenue')
      .addSelect('COUNT(*)::int', 'orders')
      .where('order.status = :status', { status: ORDER_STATUS.DELIVERED })
      .andWhere('order.deliveredAt >= :start AND order.deliveredAt < :end', { start, end })
      .groupBy('order.paymentMethod')
      .getRawMany<{ method: PaymentMethod; revenue: string; orders: number }>()
    return rows.map((row) => ({ method: row.method, revenue: toNumber(row.revenue), orders: row.orders }))
  }

  private static get orderRepo() {
    return AppDataSource.getDataSource().getRepository(Order)
  }
}

export default StatsRepository
