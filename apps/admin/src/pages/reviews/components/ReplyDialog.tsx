import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { AdminReview } from '@lib/api'
import { Modal, Stars } from '@components/ui'

interface Props {
  review: AdminReview | null
  loading: boolean
  onConfirm: (text: string) => void
  onClose: () => void
}

// US-25: Trả lời đánh giá — phản hồi hiện ngay dưới đánh giá ở trang sản phẩm
export function ReplyDialog({ review, loading, onConfirm, onClose }: Props) {
  const [text, setText] = useState(review?.adminReply ?? '')

  return (
    <Modal
      open={!!review}
      title={review?.adminReply ? 'Sửa phản hồi' : 'Trả lời đánh giá'}
      description={
        review && (
          <>
            {review.authorName} · {review.product.name}
          </>
        )
      }
      onClose={loading ? () => {} : onClose}
      className='max-w-lg'
    >
      {review && (
        <div className='mb-4 rounded-xl bg-sand/70 p-3 text-sm'>
          <Stars value={review.rating} />
          <p className='mt-1 text-ink'>
            {review.comment ?? <span className='text-muted italic'>Không có nhận xét</span>}
          </p>
        </div>
      )}
      <label htmlFor='review-reply' className='mb-1.5 block text-sm font-semibold text-forest'>
        Phản hồi của cửa hàng (khách và mọi người sẽ thấy)
      </label>
      <textarea
        id='review-reply'
        rows={4}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='VD: Cảm ơn anh/chị đã tin chọn Gốm Sứ Xanh!'
        className='w-full resize-y rounded-xl border border-clay bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
      />
      <p className='mt-1 text-xs text-muted'>Để trống rồi lưu để xoá phản hồi.</p>
      <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <button type='button' onClick={onClose} disabled={loading} className='btn-outline'>
          Đóng
        </button>
        <button
          type='button'
          onClick={() => onConfirm(text)}
          disabled={loading}
          className='btn-primary px-5 py-2.5 text-sm'
        >
          {loading && <LoaderCircle size={16} className='animate-spin' />}
          Lưu phản hồi
        </button>
      </div>
    </Modal>
  )
}
