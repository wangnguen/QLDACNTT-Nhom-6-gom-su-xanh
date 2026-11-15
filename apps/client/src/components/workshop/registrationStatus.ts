import type { RegistrationStatus } from '@lib/api'

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, { text: string; className: string }> = {
  pending: { text: 'Chờ xác nhận', className: 'bg-warning/10 text-warning' },
  confirmed: { text: 'Đã xác nhận', className: 'bg-teal/10 text-teal' },
  attended: { text: 'Đã tham gia', className: 'bg-moss/10 text-moss' },
  cancelled: { text: 'Đã huỷ', className: 'bg-clay/40 text-muted' }
}
