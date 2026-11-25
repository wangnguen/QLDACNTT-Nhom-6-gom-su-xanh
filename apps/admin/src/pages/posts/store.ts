import { create } from 'zustand'
import { toast } from 'sonner'
import {
  postCategoriesService,
  postsService,
  ApiError,
  type AdminPostQuery,
  type Paginated,
  type PostCategoryItem,
  type PostSummary
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface PostsState {
  result: Paginated<PostSummary> | null
  categories: PostCategoryItem[]
  loading: boolean
  loadError: string
  // Bài đang được đăng / gỡ / xoá
  busyId: string | null

  fetch: (query: AdminPostQuery) => Promise<void>
  fetchCategories: () => Promise<void>
  togglePublish: (post: PostSummary) => Promise<void>
  remove: (post: PostSummary) => Promise<boolean>
}

// US-22: Quản lý bài viết
export const usePostsStore = create<PostsState>((set) => ({
  result: null,
  categories: [],
  loading: false,
  loadError: '',
  busyId: null,

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, loadError: '' })
    try {
      const result = await postsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được danh sách bài viết') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchCategories: async () => {
    try {
      set({ categories: await postCategoriesService.list() })
    } catch {
      // Không có bộ lọc danh mục thì danh sách vẫn dùng được
    }
  },

  togglePublish: async (post) => {
    set({ busyId: post.id })
    try {
      const updated = await postsService.update(post.id, {
        status: post.status === 'published' ? 'draft' : 'published'
      })
      set((state) => ({
        result: state.result && {
          ...state.result,
          entries: state.result.entries.map((p) => (p.id === updated.id ? updated : p))
        }
      }))
      toast.success(updated.status === 'published' ? `Đã đăng "${post.title}"` : `Đã gỡ "${post.title}" về nháp`)
    } catch (err) {
      toast.error(errorMessage(err, 'Không đổi được trạng thái bài viết'))
    } finally {
      set({ busyId: null })
    }
  },

  remove: async (post) => {
    set({ busyId: post.id })
    try {
      await postsService.remove(post.id)
      set((state) => ({
        result: state.result && {
          ...state.result,
          total_count: state.result.total_count - 1,
          entries: state.result.entries.filter((p) => p.id !== post.id)
        }
      }))
      toast.success(`Đã xoá "${post.title}"`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Xoá bài viết thất bại'))
      return false
    } finally {
      set({ busyId: null })
    }
  }
}))
