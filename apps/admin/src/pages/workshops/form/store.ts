import { create } from 'zustand'
import { toast } from 'sonner'
import { workshopsService, ApiError, type WorkshopDetail, type WorkshopPayload } from '@lib/api'
import type { WorkshopFormInput } from '@lib/schemas/workshop'
import { fromVnParts } from '@lib/utils'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Ngày + giờ nhập theo giờ Việt Nam → ISO gửi lên server (schema đã kiểm tra hợp lệ)
const toPayload = ({
  date,
  startTime,
  endTime,
  deadline,
  images,
  description,
  instructor,
  ...rest
}: WorkshopFormInput): WorkshopPayload => {
  const [deadlineDate, deadlineTime] = deadline.split('T')
  return {
    ...rest,
    description: description || null,
    instructor: instructor || null,
    startsAt: fromVnParts(date, startTime)!.toISOString(),
    endsAt: fromVnParts(date, endTime)!.toISOString(),
    registrationDeadline: deadline ? fromVnParts(deadlineDate, deadlineTime.slice(0, 5))!.toISOString() : null,
    imageUrls: images.map((image) => image.url.trim())
  }
}

interface WorkshopFormState {
  workshop: WorkshopDetail | null
  loading: boolean
  loadError: string
  notFound: boolean
  saving: boolean
  error: string

  load: (id?: string) => Promise<void>
  submit: (id: string | undefined, data: WorkshopFormInput) => Promise<boolean>
  reset: () => void
}

const initialState = {
  workshop: null,
  loading: false,
  loadError: '',
  notFound: false,
  saving: false,
  error: ''
}

// US-11: Thêm / sửa lớp workshop
export const useWorkshopFormStore = create<WorkshopFormState>((set) => ({
  ...initialState,

  load: async (id) => {
    set({ ...initialState, loading: !!id })
    if (!id) return
    try {
      set({ workshop: await workshopsService.get(id) })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) set({ notFound: true })
      else set({ loadError: errorMessage(err, 'Không tải được dữ liệu') })
    } finally {
      set({ loading: false })
    }
  },

  submit: async (id, data) => {
    set({ saving: true, error: '' })
    try {
      const payload = toPayload(data)
      const workshop = id ? await workshopsService.update(id, payload) : await workshopsService.create(payload)
      toast.success(id ? `Đã lưu "${workshop.name}"` : `Đã thêm "${workshop.name}"`)
      return true
    } catch (err) {
      set({ error: errorMessage(err, 'Lưu lớp thất bại') })
      return false
    } finally {
      set({ saving: false })
    }
  },

  reset: () => set(initialState)
}))
