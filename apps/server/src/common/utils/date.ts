// Cửa hàng ở Việt Nam: ngày trong bộ lọc (vd ?from=2026-12-05) hiểu theo giờ Việt Nam
const VN_UTC_OFFSET = '+07:00'

// '2026-12-05' → 00:00 ngày đó (giờ Việt Nam); `addDays` để lấy mốc 00:00 của ngày sau
export const startOfVnDay = (date: string, addDays = 0): Date => {
  const start = new Date(`${date}T00:00:00${VN_UTC_OFFSET}`)
  start.setUTCDate(start.getUTCDate() + addDays)
  return start
}
