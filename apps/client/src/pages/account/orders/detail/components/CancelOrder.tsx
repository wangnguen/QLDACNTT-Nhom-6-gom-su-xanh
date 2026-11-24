import { useState } from 'react'
import { LoaderCircle, XCircle } from 'lucide-react'
import type { OrderDetail } from '@lib/api'

interface Props {
  order: OrderDetail
  cancelling: boolean
  onCancel: (reason: string) => Promise<boolean>
}

// US-16: Khách tự huỷ đơn còn chờ xác nhận; đơn đã xác nhận / đang giao thì hướng dẫn liên hệ cửa hàng
export function CancelOrder({ order, cancelling, onCancel }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')

  if (order.status === 'confirmed') {
    return (
      <p className='text-xs text-muted'>
        Đơn đã được cửa hàng xác nhận và đang chuẩn bị. Cần huỷ, vui lòng liên hệ cửa hàng.
      </p>
    )
  }
  if (!order.canCancel) return null

  if (!confirming) {
    return (
      <button
        type='button'
        onClick={() => setConfirming(true)}
        className='inline-flex items-center gap-1.5 text-sm font-semibold text-danger hover:underline'
      >
        <XCircle size={16} />
        Huỷ đơn hàng
      </button>
    )
  }

  const handleCancel = async () => {
    if (await onCancel(reason)) setConfirming(false)
  }

  return (
    <div className='space-y-2 rounded-2xl border border-danger/20 bg-danger/5 p-4'>
      <label htmlFor='cancel-reason' className='block text-sm font-semibold text-forest'>
        Huỷ đơn {order.code}? Lý do (không bắt buộc)
      </label>
      <input
        id='cancel-reason'
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={255}
        placeholder='VD: đặt nhầm mẫu, muốn đổi địa chỉ'
        className='w-full rounded-xl border border-clay bg-cream px-3.5 py-2.5 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
      />
      {order.paymentStatus === 'paid' && (
        <p className='text-xs text-ink'>
          Đơn đã thanh toán {order.paymentMethod === 'vnpay' ? 'trực tuyến' : ''} — cửa hàng sẽ hoàn tiền trong 3–5 ngày
          làm việc sau khi huỷ.
        </p>
      )}
      <div className='flex flex-wrap justify-end gap-2'>
        <button type='button' onClick={() => setConfirming(false)} disabled={cancelling} className='btn-outline'>
          Giữ đơn
        </button>
        <button
          type='button'
          onClick={handleCancel}
          disabled={cancelling}
          className='inline-flex items-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-cream hover:bg-danger/90 disabled:opacity-60'
        >
          {cancelling && <LoaderCircle size={16} className='animate-spin' />}
          Huỷ đơn hàng
        </button>
      </div>
    </div>
  )
}
