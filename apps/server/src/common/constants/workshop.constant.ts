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
