import { RegistrationCancelledBy, RegistrationStatus, WorkshopAvailability } from '@common/constants'

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
  // Số chỗ đang được giữ (đăng ký chưa huỷ)
  bookedSeats: number
  seatsLeft: number
  availability: WorkshopAvailability
  isActive: boolean
}

export type WorkshopDetail = WorkshopSummary & {
  description: string | null
  // Hạn đăng ký admin đặt; null = nhận đăng ký tới giờ bắt đầu
  registrationDeadline: Date | null
  imageUrls: string[]
}

// Thông tin lớp gắn kèm mỗi đăng ký
export type WorkshopRef = Pick<
  WorkshopSummary,
  'id' | 'name' | 'slug' | 'imageUrl' | 'location' | 'startsAt' | 'endsAt'
>

export type WorkshopRegistrationItem = {
  id: string
  // Mã đăng ký đọc cho cửa hàng khi check-in, vd WS7K3M9Q
  code: string
  seats: number
  // Học phí mỗi chỗ tại thời điểm đăng ký — admin đổi giá sau đó không ảnh hưởng
  unitPrice: number
  totalPrice: number
  contactName: string
  contactPhone: string
  contactEmail: string
  note: string | null
  status: RegistrationStatus
  cancelReason: string | null
  cancelledBy: RegistrationCancelledBy | null
  cancelledAt: Date | null
  registeredAt: Date
  // Khách tự huỷ được tới thời điểm này (trước giờ học REGISTRATION_CANCEL_BEFORE_HOURS tiếng)
  cancellableUntil: Date
  // Còn huỷ được: chưa huỷ / chưa tham gia và chưa qua cancellableUntil
  canCancel: boolean
  workshop: WorkshopRef
}
