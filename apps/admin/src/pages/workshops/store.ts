import { create } from 'zustand'
import { toast } from 'sonner'
import { workshopsService, ApiError, type AdminWorkshopQuery, type Paginated, type WorkshopSummary } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface WorkshopsState {
  result: Paginated<WorkshopSummary> | null
  loading: boolean
  loadError: string
  deleting: boolean

  fetch: (query: AdminWorkshopQuery) => Promise<void>
  toggleActive: (workshop: WorkshopSummary) => Promise<void>
  remove: (workshop: WorkshopSummary) => Promise<boolean>
}

// US-11: Quản lý lớp workshop — danh sách
export const useWorkshopsStore = create<WorkshopsState>((set) => ({
  result: null,
  loading: false,
  loadError: '',
  deleting: false,

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, loadError: '' })
    try {
      const result = await workshopsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được danh sách lớp') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  toggleActive: async (workshop) => {
    const isActive = !workshop.isActive
    const setActive = (value: boolean) =>
      set((state) => ({
        result: state.result && {
          ...state.result,
          entries: state.result.entries.map((w) => (w.id === workshop.id ? { ...w, isActive: value } : w))
        }
      }))

    setActive(isActive)
    try {
      await workshopsService.update(workshop.id, { isActive })
      toast.success(isActive ? `Đã mở "${workshop.name}"` : `Đã ẩn "${workshop.name}"`)
    } catch (err) {
      setActive(workshop.isActive)
      toast.error(errorMessage(err, 'Không đổi được trạng thái'))
    }
  },

  remove: async (workshop) => {
    set({ deleting: true })
    try {
      await workshopsService.remove(workshop.id)
      toast.success(`Đã xoá "${workshop.name}"`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Xoá lớp thất bại'))
      return false
    } finally {
      set({ deleting: false })
    }
  }
}))
