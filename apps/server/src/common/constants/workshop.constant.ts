export const WORKSHOP_SORT = {
  // Lớp sắp diễn ra trước
  START_ASC: 'start_asc',
  START_DESC: 'start_desc',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  NEWEST: 'newest'
} as const

export type WorkshopSort = (typeof WORKSHOP_SORT)[keyof typeof WORKSHOP_SORT]

// Bộ lọc trạng thái ở trang admin: đang mở / đang ẩn
export const WORKSHOP_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden'
} as const

export type WorkshopStatus = (typeof WORKSHOP_STATUS)[keyof typeof WORKSHOP_STATUS]

// Bộ lọc thời gian ở trang admin: chưa kết thúc / đã kết thúc
export const WORKSHOP_TIME = {
  UPCOMING: 'upcoming',
  PAST: 'past'
} as const

export type WorkshopTime = (typeof WORKSHOP_TIME)[keyof typeof WORKSHOP_TIME]

export const MAX_WORKSHOP_IMAGES = 8
export const MAX_WORKSHOP_PRICE = 100_000_000
export const MAX_WORKSHOP_CAPACITY = 200
export const MAX_WORKSHOP_DURATION_HOURS = 12

export const WORKSHOP_NOT_FOUND_MESSAGE = 'Không tìm thấy lớp workshop'

// Trạng thái nhận đăng ký của một lớp (tính khi trả về, không lưu DB)
export const WORKSHOP_AVAILABILITY = {
  OPEN: 'open',
  // Hết chỗ
  FULL: 'full',
  // Đã qua hạn đăng ký
  CLOSED: 'closed'
} as const

export type WorkshopAvailability = (typeof WORKSHOP_AVAILABILITY)[keyof typeof WORKSHOP_AVAILABILITY]

// ─── Đăng ký workshop ─────────────────────────────────────────────────────────

export const REGISTRATION_STATUS = {
  // Chờ cửa hàng xác nhận
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  // Đã check-in tham gia lớp
  ATTENDED: 'attended',
  CANCELLED: 'cancelled'
} as const

export type RegistrationStatus = (typeof REGISTRATION_STATUS)[keyof typeof REGISTRATION_STATUS]

// Các trạng thái đang giữ chỗ trong lớp — huỷ thì nhả chỗ
export const SEAT_HOLDING_STATUSES: RegistrationStatus[] = [
  REGISTRATION_STATUS.PENDING,
  REGISTRATION_STATUS.CONFIRMED,
  REGISTRATION_STATUS.ATTENDED
]

export const REGISTRATION_CANCELLED_BY = {
  USER: 'user',
  ADMIN: 'admin'
} as const

export type RegistrationCancelledBy = (typeof REGISTRATION_CANCELLED_BY)[keyof typeof REGISTRATION_CANCELLED_BY]

export const MAX_SEATS_PER_REGISTRATION = 10

// Đăng ký còn huỷ được: chờ xác nhận hoặc đã xác nhận
export const CANCELLABLE_STATUSES: RegistrationStatus[] = [REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.CONFIRMED]

// Khách tự huỷ được tới trước giờ học bao nhiêu tiếng (sau đó phải liên hệ cửa hàng)
export const REGISTRATION_CANCEL_BEFORE_HOURS = 24

// Cửa hàng check-in được từ bao nhiêu phút trước giờ học
export const CHECK_IN_OPENS_BEFORE_MINUTES = 60

// Trạng thái admin được chuyển sang
export const ADMIN_REGISTRATION_ACTIONS = [
  REGISTRATION_STATUS.CONFIRMED,
  REGISTRATION_STATUS.ATTENDED,
  REGISTRATION_STATUS.CANCELLED
] as const
