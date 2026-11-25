import { create } from 'zustand'
import { toast } from 'sonner'
import { reviewsService, ApiError, type AdminReview, type AdminReviewQuery, type Paginated } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface ReviewsState {
  result: Paginated<AdminReview> | null
  loading: boolean
  loadError: string
  busyId: string | null

  fetch: (query: AdminReviewQuery) => Promise<void>
  toggleHidden: (review: AdminReview) => Promise<void>
  // Trả về true khi lưu thành công
  reply: (review: AdminReview, text: string) => Promise<boolean>
  remove: (review: AdminReview) => Promise<boolean>
}

// US-25: Quản lý đánh giá
export const useReviewsStore = create<ReviewsState>((set) => {
  const replace = (updated: AdminReview) =>
    set((state) => ({
      result: state.result && {
        ...state.result,
        entries: state.result.entries.map((r) => (r.id === updated.id ? updated : r))
      }
    }))

  return {
    result: null,
    loading: false,
    loadError: '',
    busyId: null,

    fetch: async (query) => {
      const requestId = ++latestRequest
      set({ loading: true, loadError: '' })
      try {
        const result = await reviewsService.list(query)
        if (requestId === latestRequest) set({ result })
      } catch (err) {
        if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được danh sách đánh giá') })
      } finally {
        if (requestId === latestRequest) set({ loading: false })
      }
    },

    toggleHidden: async (review) => {
      set({ busyId: review.id })
      try {
        const updated = await reviewsService.moderate(review.id, { isHidden: !review.isHidden })
        replace(updated)
        toast.success(updated.isHidden ? 'Đã ẩn đánh giá khỏi trang sản phẩm' : 'Đã hiện lại đánh giá')
      } catch (err) {
        toast.error(errorMessage(err, 'Không đổi được trạng thái đánh giá'))
      } finally {
        set({ busyId: null })
      }
    },

    reply: async (review, text) => {
      set({ busyId: review.id })
      try {
        const updated = await reviewsService.moderate(review.id, { adminReply: text.trim() || null })
        replace(updated)
        toast.success(updated.adminReply ? `Đã trả lời ${review.authorName}` : 'Đã xoá phản hồi')
        return true
      } catch (err) {
        toast.error(errorMessage(err, 'Không lưu được phản hồi'))
        return false
      } finally {
        set({ busyId: null })
      }
    },

    remove: async (review) => {
      set({ busyId: review.id })
      try {
        await reviewsService.remove(review.id)
        set((state) => ({
          result: state.result && {
            ...state.result,
            total_count: state.result.total_count - 1,
            entries: state.result.entries.filter((r) => r.id !== review.id)
          }
        }))
        toast.success('Đã xoá đánh giá')
        return true
      } catch (err) {
        toast.error(errorMessage(err, 'Xoá đánh giá thất bại'))
        return false
      } finally {
        set({ busyId: null })
      }
    }
  }
})
