export const STATS_GROUP_BY = {
  DAY: 'day',
  MONTH: 'month'
} as const

export type StatsGroupBy = (typeof STATS_GROUP_BY)[keyof typeof STATS_GROUP_BY]

// Mặc định xem 30 ngày gần nhất
export const DEFAULT_STATS_DAYS = 30
// Xem theo ngày tối đa 1 năm (366 điểm trên biểu đồ)
export const MAX_DAILY_STATS_DAYS = 366
export const TOP_PRODUCTS_LIMIT = 5
