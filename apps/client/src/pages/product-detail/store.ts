import { create } from 'zustand'
import { productsService, ApiError, type ProductDetail, type ProductSummary } from '@lib/api'

const RELATED_LIMIT = 4

// Chỉ nhận kết quả của sản phẩm đang mở (bấm sang sản phẩm khác nhanh không bị lẫn dữ liệu)
let currentSlug = ''

interface ProductDetailState {
  product: ProductDetail | null
  related: ProductSummary[]
  loading: boolean
  notFound: boolean
  error: string

  load: (slug: string) => Promise<void>
  reset: () => void
}

const initialState = {
  product: null,
  related: [],
  loading: true,
  notFound: false,
  error: ''
}

// US-09: Xem chi tiết sản phẩm
export const useProductDetailStore = create<ProductDetailState>((set) => ({
  ...initialState,

  load: async (slug) => {
    currentSlug = slug
    set({ ...initialState })
    try {
      const product = await productsService.getBySlug(slug)
      if (currentSlug !== slug) return
      set({ product, loading: false })

      // Sản phẩm cùng danh mục — lỗi thì bỏ qua, không ảnh hưởng trang chi tiết
      const { entries } = await productsService
        .list({ category: product.category.slug, limit: RELATED_LIMIT + 1 })
        .catch(() => ({ entries: [] as ProductSummary[] }))
      if (currentSlug !== slug) return
      set({ related: entries.filter((p) => p.id !== product.id).slice(0, RELATED_LIMIT) })
    } catch (err) {
      if (currentSlug !== slug) return
      if (err instanceof ApiError && err.status === 404) set({ notFound: true, loading: false })
      else set({ error: err instanceof ApiError ? err.message : 'Không tải được sản phẩm', loading: false })
    }
  },

  reset: () => {
    currentSlug = ''
    set(initialState)
  }
}))
