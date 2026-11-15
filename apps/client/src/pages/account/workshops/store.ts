import { create } from 'zustand'
import { toast } from 'sonner'
import {
  registrationsService,
  ApiError,
  type MyRegistrationQuery,
  type Paginated,
  type WorkshopRegistration
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi tab nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface MyWorkshopsState {
  result: Paginated<WorkshopRegistration> | null
  loading: boolean
  error: string
  cancellingId: string | null

  fetch: (query: MyRegistrationQuery) => Promise<void>
  cancel: (registration: WorkshopRegistration, reason: string) => Promise<boolean>
}

// US-13: Lịch workshop của tôi
export const useMyWorkshopsStore = create<MyWorkshopsState>((set) => ({
  result: null,
  loading: false,
  error: '',
  cancellingId: null,

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, error: '' })
    try {
      const result = await registrationsService.listMine(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ error: errorMessage(err, 'Không tải được lịch workshop') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  cancel: async (registration, reason) => {
    set({ cancellingId: registration.id })
    try {
      const updated = await registrationsService.cancel(registration.id, reason.trim() || null)
      set((state) => ({
        result: state.result && {
          ...state.result,
          entries: state.result.entries.map((r) => (r.id === updated.id ? updated : r))
        }
      }))
      toast.success(`Đã huỷ đăng ký "${registration.workshop.name}"`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Huỷ đăng ký thất bại'))
      return false
    } finally {
      set({ cancellingId: null })
    }
  }
}))
