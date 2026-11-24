import { create } from 'zustand'
import {
  postsService,
  ApiError,
  type Paginated,
  type PostCategoryItem,
  type PostQuery,
  type PostSummary
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi danh mục nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface BlogState {
  result: Paginated<PostSummary> | null
  categories: PostCategoryItem[]
  loading: boolean
  error: string

  fetch: (query: PostQuery) => Promise<void>
  fetchCategories: () => Promise<void>
}

// US-23: Trang tin tức
export const useBlogStore = create<BlogState>((set) => ({
  result: null,
  categories: [],
  loading: false,
  error: '',

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, error: '' })
    try {
      const result = await postsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ error: errorMessage(err, 'Không tải được bài viết') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchCategories: async () => {
    try {
      set({ categories: await postsService.categories() })
    } catch {
      // Không có danh mục thì vẫn xem được tất cả bài
    }
  }
}))
