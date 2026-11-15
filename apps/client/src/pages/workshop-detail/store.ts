import { create } from 'zustand'
import {
  registrationsService,
  workshopsService,
  ApiError,
  type CreateRegistrationRequest,
  type WorkshopDetail,
  type WorkshopRegistration
} from '@lib/api'

// Chỉ nhận kết quả của lớp đang mở (bấm sang lớp khác nhanh không bị lẫn dữ liệu)
let currentSlug = ''

interface WorkshopDetailState {
  workshop: WorkshopDetail | null
  loading: boolean
  notFound: boolean
  error: string
  submitting: boolean
  submitError: string
  // Đăng ký vừa tạo thành công trên trang này
  registration: WorkshopRegistration | null

  load: (slug: string) => Promise<void>
  register: (payload: CreateRegistrationRequest) => Promise<boolean>
  reset: () => void
}

const initialState = {
  workshop: null,
  loading: true,
  notFound: false,
  error: '',
  submitting: false,
  submitError: '',
  registration: null
}

// US-12: Xem chi tiết và đăng ký lớp workshop
export const useWorkshopDetailStore = create<WorkshopDetailState>((set, get) => ({
  ...initialState,

  load: async (slug) => {
    currentSlug = slug
    set({ ...initialState })
    try {
      const workshop = await workshopsService.getBySlug(slug)
      if (currentSlug === slug) set({ workshop, loading: false })
    } catch (err) {
      if (currentSlug !== slug) return
      if (err instanceof ApiError && err.status === 404) set({ notFound: true, loading: false })
      else set({ error: err instanceof ApiError ? err.message : 'Không tải được thông tin lớp', loading: false })
    }
  },

  register: async (payload) => {
    set({ submitting: true, submitError: '' })
    try {
      const registration = await registrationsService.register(payload)
      set({ registration })
      // Tải lại để số chỗ còn lại là mới nhất
      const slug = get().workshop?.slug
      if (slug) {
        workshopsService
          .getBySlug(slug)
          .then((workshop) => currentSlug === slug && set({ workshop }))
          .catch(() => {})
      }
      return true
    } catch (err) {
      set({ submitError: err instanceof ApiError ? err.message : 'Đăng ký thất bại, vui lòng thử lại' })
      return false
    } finally {
      set({ submitting: false })
    }
  },

  reset: () => {
    currentSlug = ''
    set(initialState)
  }
}))
