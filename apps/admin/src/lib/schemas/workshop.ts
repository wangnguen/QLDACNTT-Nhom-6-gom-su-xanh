import { z } from 'zod'
import { fromVnParts } from '@lib/utils'
import { imagesField } from './catalog'

// Giới hạn khớp với server (US-11)
export const MAX_WORKSHOP_IMAGES = 8
const MAX_WORKSHOP_PRICE = 100_000_000
export const MAX_WORKSHOP_CAPACITY = 200
const MAX_DURATION_HOURS = 12

const hasLetterOrDigit = (value: string) => /[\p{L}\p{N}]/u.test(value)
const textField = (label: string, max: number) => z.string().trim().max(max, `${label} tối đa ${max} ký tự`)

// Ô số dùng valueAsNumber: để trống → NaN → báo "Vui lòng nhập ..."
const integerField = (label: string, min: number, max: number, minMessage: string) =>
  z
    .number(`Vui lòng nhập ${label.toLowerCase()}`)
    .int(`${label} phải là số nguyên`)
    .min(min, minMessage)
    .max(max, `${label} tối đa ${max.toLocaleString('vi-VN')}`)

// Ngày + giờ nhập theo giờ Việt Nam; hạn đăng ký là ô datetime-local ('' = nhận đăng ký tới giờ bắt đầu)
const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên lớp')
    .max(255, 'Tên lớp tối đa 255 ký tự')
    .refine(hasLetterOrDigit, 'Tên lớp phải chứa chữ cái hoặc chữ số'),
  instructor: textField('Người hướng dẫn', 100),
  location: z.string().trim().min(1, 'Vui lòng nhập địa điểm').max(255, 'Địa điểm tối đa 255 ký tự'),
  date: z.string().min(1, 'Vui lòng chọn ngày học'),
  startTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
  endTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
  deadline: z.string(),
  price: integerField('Học phí', 0, MAX_WORKSHOP_PRICE, 'Học phí không được âm'),
  capacity: integerField('Số chỗ', 1, MAX_WORKSHOP_CAPACITY, 'Lớp phải có ít nhất 1 chỗ'),
  description: textField('Mô tả', 5000),
  images: imagesField(MAX_WORKSHOP_IMAGES),
  isActive: z.boolean()
})

export type WorkshopFormInput = z.infer<typeof baseSchema>

// `isNew`: lớp mới phải bắt đầu sau thời điểm hiện tại (khi sửa, server kiểm tra nếu dời giờ bắt đầu)
export const workshopFormSchema = (isNew: boolean) =>
  baseSchema.superRefine((data, ctx) => {
    const startsAt = fromVnParts(data.date, data.startTime)
    const endsAt = fromVnParts(data.date, data.endTime)
    if (!startsAt || !endsAt) return

    if (isNew && startsAt.getTime() <= Date.now()) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Giờ bắt đầu phải sau thời điểm hiện tại' })
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Giờ kết thúc phải sau giờ bắt đầu' })
    } else if (endsAt.getTime() - startsAt.getTime() > MAX_DURATION_HOURS * 60 * 60 * 1000) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: `Mỗi lớp kéo dài tối đa ${MAX_DURATION_HOURS} tiếng` })
    }

    if (data.deadline) {
      const [date, time] = data.deadline.split('T')
      const deadline = fromVnParts(date, time?.slice(0, 5) ?? '')
      if (!deadline) {
        ctx.addIssue({ code: 'custom', path: ['deadline'], message: 'Hạn đăng ký không hợp lệ' })
      } else if (deadline.getTime() > startsAt.getTime()) {
        ctx.addIssue({ code: 'custom', path: ['deadline'], message: 'Hạn đăng ký không được sau giờ bắt đầu' })
      }
    }
  })
