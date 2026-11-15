import { create } from 'zustand'
import { toast } from 'sonner'
import {
  registrationsService,
  workshopsService,
  ApiError,
  type AdminRegistrationQuery,
  type Paginated,
  type RegistrationAction,
  type WorkshopRegistration,
  type WorkshopSummary
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

const SUCCESS: Record<RegistrationAction, string> = {
  confirmed: 'Đã xác nhận',
  attended: 'Đã check-in',
  cancelled: 'Đã huỷ'
}

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface RegistrationsState {
  result: Paginated<WorkshopRegistration> | null
  // Các lớp cho bộ lọc "Lớp"
  workshops: WorkshopSummary[]
  loading: boolean
  loadError: string
  // Đăng ký đang được đổi trạng thái
  updatingId: string | null

  fetch: (query: AdminRegistrationQuery) => Promise<void>
  fetchWorkshops: () => Promise<void>
  updateStatus: (registration: WorkshopRegistration, action: RegistrationAction, reason?: string) => Promise<boolean>
}

// US-13: Quản lý đăng ký workshop
export const useRegistrationsStore = create<RegistrationsState>((set) => ({
  result: null,
  workshops: [],
  loading: false,
  loadError: '',
  updatingId: null,

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, loadError: '' })
    try {
      const result = await registrationsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được danh sách đăng ký') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchWorkshops: async () => {
    try {
      const { entries } = await workshopsService.list({ limit: 100, sort: 'start_desc' })
      set({ workshops: entries })
    } catch {
      // Không có bộ lọc theo lớp thì danh sách đăng ký vẫn dùng được
    }
  },

  updateStatus: async (registration, action, reason) => {
    set({ updatingId: registration.id })
    try {
      const updated = await registrationsService.updateStatus(registration.id, action, reason?.trim() || null)
      set((state) => ({
        result: state.result && {
          ...state.result,
          entries: state.result.entries.map((r) => (r.id === updated.id ? updated : r))
        }
      }))
      toast.success(`${SUCCESS[action]} ${registration.code} — ${registration.contactName}`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Không đổi được trạng thái'))
      return false
    } finally {
      set({ updatingId: null })
    }
  }
}))
