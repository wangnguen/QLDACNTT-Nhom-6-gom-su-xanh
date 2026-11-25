import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { AdminOrder } from '@lib/api'
import { Modal } from '@components/ui'

interface Props {
  order: AdminOrder | null
  loading: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

// US-19: Giao không thành công — hàng hoàn về kho, đơn đã thanh toán chuyển sang chờ hoàn tiền
export function ReturnDialog({ order, loading, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const error = reason.trim() ? '' : 'Vui lòng nhập lý do giao không thành công'

  return (
    <Modal
      open={!!order}
      title='Giao không thành công?'
      description={
        order && (
          <>
            <strong className='text-forest'>{order.code}</strong> — sản phẩm được trả lại kho
            {order.paymentStatus === 'paid' && ', đơn đã thanh toán sẽ chuyển sang chờ hoàn tiền'}.
          </>
        )
      }
      onClose={loading ? () => {} : onClose}
      className='max-w-md'
    >
      <label htmlFor='return-reason' className='mb-1.5 block text-sm font-semibold text-forest'>
        Lý do (khách sẽ thấy)
      </label>
      <textarea
        id='return-reason'
        rows={3}
        maxLength={255}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder='VD: Khách không nghe máy 3 lần, hàng hoàn về cửa hàng'
        aria-invalid={touched && !!error}
        className='w-full resize-y rounded-xl border border-clay bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
      />
      {touched && error && <p className='mt-1.5 text-xs font-medium text-danger'>{error}</p>}
      <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <button type='button' onClick={onClose} disabled={loading} className='btn-outline'>
          Đóng
        </button>
        <button
          type='button'
          onClick={() => {
            setTouched(true)
            if (!error) onConfirm(reason.trim())
          }}
          disabled={loading}
          className='inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {loading && <LoaderCircle size={16} className='animate-spin' />}
          Ghi nhận hoàn hàng
        </button>
      </div>
    </Modal>
  )
}
