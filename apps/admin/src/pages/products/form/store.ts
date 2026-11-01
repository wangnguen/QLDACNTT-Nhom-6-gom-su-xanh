import { create } from 'zustand'
import { toast } from 'sonner'
import {
  categoriesService,
  productsService,
  ApiError,
  type CategoryItem,
  type ProductDetail,
  type ProductPayload
} from '@lib/api'
import type { ProductFormInput } from '@lib/schemas/catalog'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

const toPayload = ({ images, description, material, dimensions, ...rest }: ProductFormInput): ProductPayload => ({
  ...rest,
  description: description || null,
  material: material || null,
  dimensions: dimensions || null,
  imageUrls: images.map((image) => image.url.trim())
})

interface ProductFormState {
  product: ProductDetail | null
  categories: CategoryItem[]
  loading: boolean
  loadError: string
  notFound: boolean
  saving: boolean
  error: string

  // Tải danh mục (và sản phẩm khi đang sửa)
  load: (id?: string) => Promise<void>
  submit: (id: string | undefined, data: ProductFormInput) => Promise<boolean>
  reset: () => void
}

const initialState = {
  product: null,
  categories: [],
  loading: true,
  loadError: '',
  notFound: false,
  saving: false,
  error: ''
}

// US-07: Thêm / sửa sản phẩm
export const useProductFormStore = create<ProductFormState>((set) => ({
  ...initialState,

  load: async (id) => {
    set({ ...initialState, loading: true })
    try {
      const [categories, product] = await Promise.all([
        categoriesService.list(),
        id ? productsService.get(id) : Promise.resolve(null)
      ])
      set({ categories, product })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) set({ notFound: true })
      else set({ loadError: errorMessage(err, 'Không tải được dữ liệu') })
    } finally {
      set({ loading: false })
    }
  },

  submit: async (id, data) => {
    set({ saving: true, error: '' })
    try {
      const payload = toPayload(data)
      const product = id ? await productsService.update(id, payload) : await productsService.create(payload)
      toast.success(id ? `Đã lưu "${product.name}"` : `Đã thêm "${product.name}"`)
      return true
    } catch (err) {
      set({ error: errorMessage(err, 'Lưu sản phẩm thất bại') })
      return false
    } finally {
      set({ saving: false })
    }
  },

  reset: () => set(initialState)
}))
