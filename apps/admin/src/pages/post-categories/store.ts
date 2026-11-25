import { create } from 'zustand'
import { toast } from 'sonner'
import { postCategoriesService, ApiError, type PostCategoryItem } from '@lib/api'
import type { PostCategoryFormInput } from '@lib/schemas/blog'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface PostCategoriesState {
  categories: PostCategoryItem[]
  loading: boolean
  loadError: string
  saving: boolean
  formError: string
  deleting: boolean

  fetch: () => Promise<void>
  // `id` null = thêm mới; trả về true khi lưu thành công để đóng hộp thoại
  save: (id: string | null, data: PostCategoryFormInput) => Promise<boolean>
  toggleActive: (category: PostCategoryItem) => Promise<void>
  remove: (category: PostCategoryItem) => Promise<boolean>
  clearFormError: () => void
}

// US-21: Quản lý danh mục bài viết
export const usePostCategoriesStore = create<PostCategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  loadError: '',
  saving: false,
  formError: '',
  deleting: false,

  fetch: async () => {
    set({ loading: true, loadError: '' })
    try {
      set({ categories: await postCategoriesService.list() })
    } catch (err) {
      set({ loadError: errorMessage(err, 'Không tải được danh mục') })
    } finally {
      set({ loading: false })
    }
  },

  save: async (id, { name, description, isActive }) => {
    set({ saving: true, formError: '' })
    try {
      const payload = { name, description: description || null, isActive }
      if (id) await postCategoriesService.update(id, payload)
      else await postCategoriesService.create(payload)
      toast.success(id ? 'Đã cập nhật danh mục bài viết' : 'Đã thêm danh mục bài viết')
      await get().fetch()
      return true
    } catch (err) {
      set({ formError: errorMessage(err, 'Lưu danh mục thất bại') })
      return false
    } finally {
      set({ saving: false })
    }
  },

  // Đổi ngay trên giao diện, lỗi thì trả lại như cũ
  toggleActive: async (category) => {
    const isActive = !category.isActive
    const setActive = (value: boolean) =>
      set((state) => ({
        categories: state.categories.map((c) => (c.id === category.id ? { ...c, isActive: value } : c))
      }))

    setActive(isActive)
    try {
      await postCategoriesService.update(category.id, { isActive })
      toast.success(isActive ? `Đã hiện danh mục "${category.name}"` : `Đã ẩn danh mục "${category.name}"`)
    } catch (err) {
      setActive(category.isActive)
      toast.error(errorMessage(err, 'Không đổi được trạng thái'))
    }
  },

  remove: async (category) => {
    set({ deleting: true })
    try {
      await postCategoriesService.remove(category.id)
      set((state) => ({ categories: state.categories.filter((c) => c.id !== category.id) }))
      toast.success(`Đã xoá danh mục "${category.name}"`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Xoá danh mục thất bại'))
      return false
    } finally {
      set({ deleting: false })
    }
  },

  clearFormError: () => set({ formError: '' })
}))
