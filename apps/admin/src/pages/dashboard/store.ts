import { create } from 'zustand'
import { statsService, ApiError, type RevenueStats, type StatsGroupBy } from '@lib/api'

// Chỉ nhận kết quả của lần gọi mới nhất (đổi khoảng thời gian nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface DashboardState {
  stats: RevenueStats | null
  loading: boolean
  error: string

  fetch: (query: { from?: string; to?: string; groupBy: StatsGroupBy }) => Promise<void>
}

// US-26: Thống kê doanh thu
export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: '',

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, error: '' })
    try {
      const stats = await statsService.revenue(query)
      if (requestId === latestRequest) set({ stats })
    } catch (err) {
      if (requestId === latestRequest) {
        set({ error: err instanceof ApiError ? err.message : 'Không tải được số liệu thống kê' })
      }
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  }
}))
