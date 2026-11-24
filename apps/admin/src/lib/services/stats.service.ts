import { http } from '../axios'
import type { RevenueStats, StatsGroupBy } from '../types'

// US-26: Thống kê doanh thu — bỏ trống from/to thì xem 30 ngày gần nhất
export async function revenue(query: { from?: string; to?: string; groupBy?: StatsGroupBy }): Promise<RevenueStats> {
  const { data } = await http.get<RevenueStats>('/admin/stats/revenue', { params: query })
  return data
}

export const statsService = {
  revenue
}
