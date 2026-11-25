export const MIN_RATING = 1
export const MAX_RATING = 5
export const MAX_REVIEW_COMMENT_LENGTH = 1000

export const REVIEW_NOT_FOUND_MESSAGE = 'Không tìm thấy đánh giá'

// Bộ lọc ở trang admin: đang hiện / đã ẩn
export const REVIEW_STATUS = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden'
} as const

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS]

export const MAX_ADMIN_REPLY_LENGTH = 1000
