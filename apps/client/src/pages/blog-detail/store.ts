import { create } from 'zustand'
import { postsService, ApiError, type PostDetail } from '@lib/api'

interface PostDetailState {
  post: PostDetail | null
  loading: boolean
  notFound: boolean
  error: string

  fetch: (slug: string) => Promise<void>
}

// Mỗi slug chỉ gọi một lần (StrictMode chạy effect hai lần — tránh cộng hai lượt xem)
let requestedSlug = ''

// US-23: Đọc bài viết
export const usePostDetailStore = create<PostDetailState>((set) => ({
  post: null,
  loading: false,
  notFound: false,
  error: '',

  fetch: async (slug) => {
    if (requestedSlug === slug) return
    requestedSlug = slug
    set({ post: null, loading: true, notFound: false, error: '' })
    try {
      set({ post: await postsService.getBySlug(slug) })
    } catch (err) {
      requestedSlug = ''
      if (err instanceof ApiError && err.status === 404) set({ notFound: true })
      else set({ error: err instanceof ApiError ? err.message : 'Không tải được bài viết' })
    } finally {
      set({ loading: false })
    }
  }
}))
