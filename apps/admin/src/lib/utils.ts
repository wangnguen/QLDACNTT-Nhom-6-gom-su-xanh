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

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' })

// "09:00 05/12/2026"
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value))
}

// "T7, 05/12/2026"
export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value))
}

// "09:00 – 11:30"
export function formatTimeRange(start: string | Date, end: string | Date): string {
  return `${timeFormatter.format(new Date(start))} – ${timeFormatter.format(new Date(end))}`
}

// ─── Ô nhập ngày giờ (type=date / time / datetime-local) theo giờ Việt Nam ───

const VN_OFFSET_MS = 7 * 60 * 60 * 1000

// ISO → { date: '2026-12-05', time: '09:00' } theo giờ Việt Nam
export function toVnParts(value: string | Date): { date: string; time: string } {
  const iso = new Date(new Date(value).getTime() + VN_OFFSET_MS).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) }
}

// '2026-12-05' + '09:00' (giờ Việt Nam) → Date; chuỗi không hợp lệ → null
export function fromVnParts(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null
  const result = new Date(`${date}T${time}:00+07:00`)
  return Number.isNaN(result.getTime()) ? null : result
}
