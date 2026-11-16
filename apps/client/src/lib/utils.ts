export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

const priceFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// 450000 → "450.000 ₫"
export function formatPrice(value: number): string {
  return priceFormatter.format(value)
}

// Cửa hàng ở Việt Nam: luôn hiển thị theo giờ Việt Nam dù máy người dùng đặt múi giờ khác
const TIME_ZONE = 'Asia/Ho_Chi_Minh'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})
const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit'
})
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' })

// "Thứ Bảy, 05/12/2026"
export function formatDate(value: string | Date): string {
  const text = dateFormatter.format(new Date(value))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// "T7, 05/12"
export function formatShortDate(value: string | Date): string {
  return shortDateFormatter.format(new Date(value))
}

export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value))
}

// "09:00 – 11:30"
export function formatTimeRange(start: string | Date, end: string | Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

// "09:00, Thứ Bảy, 05/12/2026"
export function formatDateTime(value: string | Date): string {
  return `${formatTime(value)}, ${formatDate(value)}`
}

// Ngày (YYYY-MM-DD) theo giờ Việt Nam của một thời điểm, lệch `addDays` ngày
export function toVnDate(value: Date = new Date(), addDays = 0): string {
  const vn = new Date(value.getTime() + 7 * 60 * 60 * 1000)
  vn.setUTCDate(vn.getUTCDate() + addDays)
  return vn.toISOString().slice(0, 10)
}
