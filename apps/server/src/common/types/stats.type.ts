import { PaymentMethod, StatsGroupBy } from '@common/constants'

export type RevenueSummary = {
  // Doanh thu = tổng tiền (gồm phí giao hàng) các đơn giao thành công trong kỳ, tính theo ngày giao
  revenue: number
  deliveredOrders: number
  // revenue / deliveredOrders, 0 khi chưa có đơn
  averageOrderValue: number
  // Đơn đặt trong kỳ (mọi trạng thái)
  newOrders: number
  // Đơn bị huỷ trong kỳ
  cancelledOrders: number
  // Tiền đã hoàn cho khách trong kỳ
  refundedAmount: number
  // Học phí các lượt đăng ký workshop đã tham gia, lớp diễn ra trong kỳ
  workshopRevenue: number
}

export type RevenuePoint = {
  // 'YYYY-MM-DD' (theo ngày) hoặc 'YYYY-MM' (theo tháng), giờ Việt Nam
  period: string
  revenue: number
  orders: number
}

export type TopProduct = {
  productId: string | null
  name: string
  slug: string
  imageUrl: string | null
  quantity: number
  revenue: number
}

export type RevenueStats = {
  from: string
  to: string
  groupBy: StatsGroupBy
  summary: RevenueSummary
  // Kỳ liền trước cùng độ dài — để so sánh tăng / giảm
  previous: RevenueSummary
  series: RevenuePoint[]
  topProducts: TopProduct[]
  byPaymentMethod: { method: PaymentMethod; revenue: number; orders: number }[]
}
