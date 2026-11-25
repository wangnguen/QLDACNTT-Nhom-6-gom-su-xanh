import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { AdminOrder } from '@lib/api'
import { formatPrice } from '@lib/utils'
import { Modal } from '@components/ui'

interface Props {
  order: AdminOrder | null
  loading: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

// US-18: Huỷ đơn kèm lý do — khách sẽ thấy lý do ở trang đơn hàng
export function CancelOrderDialog({ order, loading, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={!!order}
      title='Huỷ đơn hàng?'
      description={
        order && (
          <>
            <strong className='text-forest'>{order.code}</strong> · {order.recipientName} · {formatPrice(order.total)} —
            sản phẩm được trả lại kho.
            {order.paymentStatus === 'paid' && ' Đơn đã thanh toán sẽ chuyển sang chờ hoàn tiền.'}
          </>
        )
      }
      onClose={loading ? () => {} : onClose}
      className='max-w-md'
    >
      <label htmlFor='cancel-reason' className='mb-1.5 block text-sm font-semibold text-forest'>
        Lý do huỷ (khách sẽ thấy)
      </label>
      <textarea
        id='cancel-reason'
        rows={3}
        maxLength={255}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder='VD: Sản phẩm bị lỗi men khi kiểm hàng'
        className='w-full resize-y rounded-xl border border-clay bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
      />
      <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <button type='button' onClick={onClose} disabled={loading} className='btn-outline'>
          Giữ đơn
        </button>
        <button
          type='button'
          onClick={() => onConfirm(reason)}
          disabled={loading}
          className='inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {loading && <LoaderCircle size={16} className='animate-spin' />}
          Huỷ đơn hàng
        </button>
      </div>
    </Modal>
  )
}
