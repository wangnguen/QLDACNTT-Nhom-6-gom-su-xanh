import { create } from 'zustand'
import { workshopsService, ApiError, type Paginated, type WorkshopQuery, type WorkshopSummary } from '@lib/api'

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface WorkshopsState {
  result: Paginated<WorkshopSummary> | null
  loading: boolean
  error: string

  fetch: (query: WorkshopQuery) => Promise<void>
}

// US-12: Xem danh sách lớp workshop
export const useWorkshopsStore = create<WorkshopsState>((set) => ({
  result: null,
  loading: false,
  error: '',

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, error: '' })
    try {
      const result = await workshopsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) {
        set({ error: err instanceof ApiError ? err.message : 'Không tải được lịch workshop' })
      }
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  }
}))
