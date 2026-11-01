import { create } from 'zustand'
import { toast } from 'sonner'
import {
  categoriesService,
  productsService,
  ApiError,
  type AdminProductQuery,
  type CategoryItem,
  type Paginated,
  type ProductSummary
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface ProductsState {
  result: Paginated<ProductSummary> | null
  categories: CategoryItem[]
  loading: boolean
  loadError: string
  deleting: boolean

  fetch: (query: AdminProductQuery) => Promise<void>
  fetchCategories: () => Promise<void>
  toggleActive: (product: ProductSummary) => Promise<void>
  remove: (product: ProductSummary) => Promise<boolean>
}

// US-07: Quản lý sản phẩm — danh sách
export const useProductsStore = create<ProductsState>((set) => ({
  result: null,
  categories: [],
  loading: false,
  loadError: '',
  deleting: false,

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, loadError: '' })
    try {
      const result = await productsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được sản phẩm') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchCategories: async () => {
    try {
      set({ categories: await categoriesService.list() })
    } catch {
      // Bộ lọc danh mục không có cũng không sao — danh sách sản phẩm vẫn dùng được
    }
  },

  toggleActive: async (product) => {
    const isActive = !product.isActive
    const setActive = (value: boolean) =>
      set((state) => ({
        result: state.result && {
          ...state.result,
          entries: state.result.entries.map((p) => (p.id === product.id ? { ...p, isActive: value } : p))
        }
      }))

    setActive(isActive)
    try {
      await productsService.update(product.id, { isActive })
      toast.success(isActive ? `Đã mở bán "${product.name}"` : `Đã ẩn "${product.name}"`)
    } catch (err) {
      setActive(product.isActive)
      toast.error(errorMessage(err, 'Không đổi được trạng thái'))
    }
  },

  remove: async (product) => {
    set({ deleting: true })
    try {
      await productsService.remove(product.id)
      toast.success(`Đã xoá "${product.name}"`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Xoá sản phẩm thất bại'))
      return false
    } finally {
      set({ deleting: false })
    }
  }
}))
