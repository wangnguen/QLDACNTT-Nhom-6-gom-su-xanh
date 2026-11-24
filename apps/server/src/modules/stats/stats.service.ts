import { DEFAULT_STATS_DAYS, PAYMENT_METHOD, STATS_GROUP_BY, StatsGroupBy, TOP_PRODUCTS_LIMIT } from '@common/constants'
import { RevenuePoint, RevenueStats, RevenueSummary } from '@common/types'
import { startOfVnDay } from '@common/utils/date'

import { RevenueQuery } from './dto'
import StatsRepository, { Range } from './stats.repository'

const DAY_MS = 24 * 60 * 60 * 1000
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

// Ngày hôm nay (YYYY-MM-DD) theo giờ Việt Nam, lệch `addDays` ngày
export const vnDate = (now: Date, addDays = 0) =>
  new Date(now.getTime() + VN_OFFSET_MS + addDays * DAY_MS).toISOString().slice(0, 10)

// Mọi kỳ (ngày hoặc tháng) từ `from` tới `to`, để biểu đồ có đủ điểm kể cả kỳ không có đơn
export const listPeriods = (from: string, to: string, groupBy: StatsGroupBy): string[] => {
  const periods: string[] = []
  if (groupBy === STATS_GROUP_BY.MONTH) {
    let [year, month] = from.slice(0, 7).split('-').map(Number)
    const last = to.slice(0, 7)
    for (;;) {
      const label = `${year}-${String(month).padStart(2, '0')}`
      periods.push(label)
      if (label >= last) break
      month = month === 12 ? 1 : month + 1
      if (month === 1) year++
    }
    return periods
  }
  for (let day = Date.parse(from); day <= Date.parse(to); day += DAY_MS) {
    periods.push(new Date(day).toISOString().slice(0, 10))
  }
  return periods
}

class StatsService {
  // US-26: Thống kê doanh thu trong khoảng ngày (giờ Việt Nam), so với kỳ liền trước cùng độ dài
  static async revenue(query: RevenueQuery, now = new Date()): Promise<RevenueStats> {
    const to = query.to ?? vnDate(now)
    const from = query.from ?? vnDate(new Date(Date.parse(to)), -(DEFAULT_STATS_DAYS - 1))
    const range: Range = { start: startOfVnDay(from), end: startOfVnDay(to, 1) }
    const length = range.end.getTime() - range.start.getTime()
    const previousRange: Range = { start: new Date(range.start.getTime() - length), end: range.start }

    const [summary, previous, points, topProducts, byMethod] = await Promise.all([
      this.summarize(range),
      this.summarize(previousRange),
      StatsRepository.revenueSeries(range, query.groupBy),
      StatsRepository.topProducts(range, TOP_PRODUCTS_LIMIT),
      StatsRepository.revenueByPaymentMethod(range)
    ])

    const byPeriod = new Map(points.map((point) => [point.period, point]))
    const series: RevenuePoint[] = listPeriods(from, to, query.groupBy).map(
      (period) => byPeriod.get(period) ?? { period, revenue: 0, orders: 0 }
    )

    return {
      from,
      to,
      groupBy: query.groupBy,
      summary,
      previous,
      series,
      topProducts,
      // Đủ mọi phương thức, chưa có đơn thì là 0
      byPaymentMethod: Object.values(PAYMENT_METHOD).map(
        (method) => byMethod.find((row) => row.method === method) ?? { method, revenue: 0, orders: 0 }
      )
    }
  }

  private static async summarize(range: Range): Promise<RevenueSummary> {
    const [delivered, newOrders, cancelledOrders, refundedAmount, workshopRevenue] = await Promise.all([
      StatsRepository.deliveredTotals(range),
      StatsRepository.countPlaced(range),
      StatsRepository.countCancelled(range),
      StatsRepository.refundedAmount(range),
      StatsRepository.workshopRevenue(range)
    ])
    return {
      revenue: delivered.revenue,
      deliveredOrders: delivered.orders,
      averageOrderValue: delivered.orders ? Math.round(delivered.revenue / delivered.orders) : 0,
      newOrders,
      cancelledOrders,
      refundedAmount,
      workshopRevenue
    }
  }
}

export default StatsService
