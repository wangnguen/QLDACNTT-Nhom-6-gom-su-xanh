import { create } from 'zustand'
import { productsService, workshopsService, type ProductSummary, type WorkshopSummary } from '@lib/api'

interface HomeState {
  newestProducts: ProductSummary[] | null
  upcomingWorkshops: WorkshopSummary[] | null

  fetchNewestProducts: () => Promise<void>
  fetchUpcomingWorkshops: () => Promise<void>
}

// US-08: Mục "Sản phẩm mới" ở trang chủ
export const useHomeStore = create<HomeState>((set) => ({
  newestProducts: null,
  upcomingWorkshops: null,

  fetchNewestProducts: async () => {
    try {
      const { entries } = await productsService.list({ limit: 4, sort: 'newest' })
      set({ newestProducts: entries })
    } catch {
      // Lỗi thì ẩn mục này, trang chủ vẫn hiển thị bình thường
      set({ newestProducts: [] })
    }
  },

  // US-12: Mục "Workshop sắp diễn ra" — 3 lớp còn nhận đăng ký gần nhất
  fetchUpcomingWorkshops: async () => {
    try {
      const { entries } = await workshopsService.list({ limit: 3, availableOnly: true, sort: 'start_asc' })
      set({ upcomingWorkshops: entries })
    } catch {
      set({ upcomingWorkshops: [] })
    }
  }
}))
