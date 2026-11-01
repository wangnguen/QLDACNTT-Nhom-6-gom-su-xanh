import { create } from 'zustand'
import {
  categoriesService,
  productsService,
  ApiError,
  type CategoryItem,
  type Paginated,
  type ProductQuery,
  type ProductSummary
} from '@lib/api'

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface ProductsState {
  result: Paginated<ProductSummary> | null
  categories: CategoryItem[]
  loading: boolean
  error: string

  fetch: (query: ProductQuery) => Promise<void>
  fetchCategories: () => Promise<void>
}

// US-08: Xem danh sách sản phẩm
export const useProductsStore = create<ProductsState>((set) => ({
  result: null,
  categories: [],
  loading: false,
  error: '',

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, error: '' })
    try {
      const result = await productsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) {
        set({ error: err instanceof ApiError ? err.message : 'Không tải được sản phẩm' })
      }
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchCategories: async () => {
    try {
      set({ categories: await categoriesService.list() })
    } catch {
      // Không có bộ lọc danh mục thì danh sách sản phẩm vẫn xem được
    }
  }
}))
