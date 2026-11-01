import { create } from 'zustand'
import { productsService, type ProductSummary } from '@lib/api'

interface HomeState {
  newestProducts: ProductSummary[] | null

  fetchNewestProducts: () => Promise<void>
}

// US-08: Mục "Sản phẩm mới" ở trang chủ
export const useHomeStore = create<HomeState>((set) => ({
  newestProducts: null,

  fetchNewestProducts: async () => {
    try {
      const { entries } = await productsService.list({ limit: 4, sort: 'newest' })
      set({ newestProducts: entries })
    } catch {
      // Lỗi thì ẩn mục này, trang chủ vẫn hiển thị bình thường
      set({ newestProducts: [] })
    }
  }
}))
