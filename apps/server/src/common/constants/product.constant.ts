export const PRODUCT_SORT = {
  NEWEST: 'newest',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  NAME_ASC: 'name_asc'
} as const

export type ProductSort = (typeof PRODUCT_SORT)[keyof typeof PRODUCT_SORT]

// Bộ lọc trạng thái ở trang admin: đang bán / đang ẩn
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden'
} as const

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS]

export const MAX_PRODUCT_IMAGES = 8
export const MAX_PRODUCT_PRICE = 1_000_000_000
export const MAX_PRODUCT_STOCK = 100_000

export const DEFAULT_PAGE_LIMIT = 12
export const MAX_PAGE_LIMIT = 100
