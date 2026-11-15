// Dùng cho danh sách lớp (thẻ lớp ở trang client, bảng ở trang admin)
export type WorkshopSummary = {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  instructor: string | null
  location: string
  startsAt: Date
  endsAt: Date
  // Thời điểm đóng đăng ký thực tế: hạn đăng ký admin đặt, không đặt thì là giờ bắt đầu
  registrationClosesAt: Date
  price: number
  capacity: number
  isActive: boolean
}

export type WorkshopDetail = WorkshopSummary & {
  description: string | null
  // Hạn đăng ký admin đặt; null = nhận đăng ký tới giờ bắt đầu
  registrationDeadline: Date | null
  imageUrls: string[]
}
