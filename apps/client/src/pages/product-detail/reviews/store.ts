import { create } from 'zustand'
import { toast } from 'sonner'
import { reviewsService, ApiError, type MyReviewStatus, type ProductReviews } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

export const REVIEW_PAGE_SIZE = 5

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc sao / sản phẩm nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface ReviewsState {
  slug: string
  rating: number | null
  result: ProductReviews | null
  loading: boolean
  error: string
  mine: MyReviewStatus | null
  submitting: boolean

  fetch: (slug: string, rating: number | null, page: number) => Promise<void>
  fetchMine: (slug: string) => Promise<void>
  // Viết mới hoặc sửa đánh giá của mình; trả về true khi thành công
  submit: (productId: string, rating: number, comment: string) => Promise<boolean>
  reset: () => void
}

// US-24: Đánh giá sản phẩm
export const useReviewsStore = create<ReviewsState>((set, get) => ({
  slug: '',
  rating: null,
  result: null,
  loading: false,
  error: '',
  mine: null,
  submitting: false,

  fetch: async (slug, rating, page) => {
    const requestId = ++latestRequest
    set({ slug, rating, loading: true, error: '' })
    try {
      const result = await reviewsService.listForProduct(slug, {
        limit: REVIEW_PAGE_SIZE,
        offset: (page - 1) * REVIEW_PAGE_SIZE,
        rating: rating ?? undefined
      })
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ error: errorMessage(err, 'Không tải được đánh giá') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchMine: async (slug) => {
    try {
      set({ mine: await reviewsService.getMine(slug) })
    } catch {
      set({ mine: null })
    }
  },

  submit: async (productId, rating, comment) => {
    const { mine, slug } = get()
    set({ submitting: true })
    try {
      const text = comment.trim() || null
      if (mine?.review) await reviewsService.update(mine.review.id, rating, text)
      else await reviewsService.create(productId, rating, text)
      toast.success(mine?.review ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá sản phẩm')
      await Promise.all([get().fetchMine(slug), get().fetch(slug, get().rating, 1)])
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Gửi đánh giá thất bại'))
      return false
    } finally {
      set({ submitting: false })
    }
  },

  reset: () => set({ result: null, mine: null, rating: null, error: '' })
}))
