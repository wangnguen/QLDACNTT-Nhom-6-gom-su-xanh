import type { WorkshopAvailability } from '@lib/api'

// Còn ít chỗ thì nhắc khách (dưới ngưỡng này)
const FEW_SEATS = 3

export function availabilityLabel(availability: WorkshopAvailability, seatsLeft: number) {
  if (availability === 'closed') return { text: 'Hết hạn đăng ký', className: 'bg-forest/85 text-cream' }
  if (availability === 'full') return { text: 'Hết chỗ', className: 'bg-forest/85 text-cream' }
  if (seatsLeft <= FEW_SEATS) return { text: `Chỉ còn ${seatsLeft} chỗ`, className: 'bg-warning text-cream' }
  return null
}
