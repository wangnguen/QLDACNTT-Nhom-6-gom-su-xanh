import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { MyReviewStatus } from '@lib/api'
import { StarInput } from '@components/product'

interface Props {
  mine: MyReviewStatus
  submitting: boolean
  onSubmit: (rating: number, comment: string) => Promise<boolean>
  onCancel?: () => void
}

// US-24: Viết / sửa đánh giá (chỉ khách đã nhận hàng)
export function ReviewForm({ mine, submitting, onSubmit, onCancel }: Props) {
  const [rating, setRating] = useState(mine.review?.rating ?? 0)
  const [comment, setComment] = useState(mine.review?.comment ?? '')
  const [touched, setTouched] = useState(false)

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        setTouched(true)
        if (rating > 0 && (await onSubmit(rating, comment))) setTouched(false)
      }}
      className='space-y-3 rounded-2xl border border-clay/70 bg-cream p-5'
    >
      <p className='font-semibold text-forest'>{mine.review ? 'Sửa đánh giá của bạn' : 'Bạn thấy sản phẩm thế nào?'}</p>
      <StarInput value={rating} onChange={setRating} disabled={submitting} />
      {touched && rating === 0 && <p className='text-xs font-medium text-danger'>Vui lòng chọn số sao</p>}
      <label htmlFor='review-comment' className='sr-only'>
        Nhận xét
      </label>
      <textarea
        id='review-comment'
        rows={3}
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder='Chia sẻ cảm nhận về màu men, chất lượng, đóng gói... (không bắt buộc)'
        className='w-full resize-y rounded-xl border border-clay bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
      />
      <div className='flex flex-wrap justify-end gap-2'>
        {onCancel && (
          <button type='button' onClick={onCancel} disabled={submitting} className='btn-outline'>
            Huỷ
          </button>
        )}
        <button type='submit' disabled={submitting} className='btn-primary px-5 py-2.5 text-sm'>
          {submitting && <LoaderCircle size={16} className='animate-spin' />}
          {mine.review ? 'Lưu đánh giá' : 'Gửi đánh giá'}
        </button>
      </div>
    </form>
  )
}
