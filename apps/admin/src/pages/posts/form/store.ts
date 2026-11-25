import { create } from 'zustand'
import { toast } from 'sonner'
import {
  postCategoriesService,
  postsService,
  ApiError,
  type PostCategoryItem,
  type PostDetail,
  type PostStatus
} from '@lib/api'
import type { PostFormInput } from '@lib/schemas/blog'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface PostFormState {
  post: PostDetail | null
  categories: PostCategoryItem[]
  loading: boolean
  loadError: string
  saving: boolean
  error: string

  // Tải danh mục (và bài viết khi đang sửa)
  load: (id?: string) => Promise<void>
  // Trả về bài đã lưu (để chuyển trang) hoặc null khi lỗi
  submit: (id: string | undefined, data: PostFormInput, status: PostStatus) => Promise<PostDetail | null>
}

// US-22: Viết / sửa bài viết
export const usePostFormStore = create<PostFormState>((set) => ({
  post: null,
  categories: [],
  loading: true,
  loadError: '',
  saving: false,
  error: '',

  load: async (id) => {
    set({ post: null, loading: true, loadError: '', error: '' })
    try {
      const [categories, post] = await Promise.all([
        postCategoriesService.list(),
        id ? postsService.get(id) : Promise.resolve(null)
      ])
      set({ categories, post })
    } catch (err) {
      set({ loadError: errorMessage(err, 'Không tải được bài viết') })
    } finally {
      set({ loading: false })
    }
  },

  submit: async (id, { excerpt, coverImageUrl, ...rest }, status) => {
    set({ saving: true, error: '' })
    try {
      const payload = { ...rest, excerpt: excerpt || null, coverImageUrl: coverImageUrl || null, status }
      const post = id ? await postsService.update(id, payload) : await postsService.create(payload)
      set({ post })
      toast.success(status === 'published' ? 'Đã lưu và đăng bài' : 'Đã lưu bản nháp')
      return post
    } catch (err) {
      set({ error: errorMessage(err, 'Lưu bài viết thất bại') })
      return null
    } finally {
      set({ saving: false })
    }
  }
}))
