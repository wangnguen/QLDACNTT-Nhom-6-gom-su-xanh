import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { AdminTransaction } from '@lib/api'
import { formatPrice } from '@lib/utils'
import { Modal } from '@components/ui'

const inputClass =
  'w-full rounded-xl border border-clay bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'

interface Props {
  transaction: AdminTransaction | null
  loading: boolean
  onConfirm: (referenceNo: string, note: string) => void
  onClose: () => void
}

// US-20: Xác nhận đã chuyển khoản / hoàn qua VNPay cho khách
export function RefundDialog({ transaction, loading, onConfirm, onClose }: Props) {
  const [referenceNo, setReferenceNo] = useState('')
  const [note, setNote] = useState('')

  return (
    <Modal
      open={!!transaction}
      title='Xác nhận đã hoàn tiền'
      description={
        transaction && (
          <>
            Hoàn <strong className='text-forest'>{formatPrice(transaction.amount)}</strong> cho{' '}
            {transaction.customer.fullName} · đơn {transaction.order.code}. Hãy chuyển tiền cho khách trước khi xác
            nhận.
          </>
        )
      }
      onClose={loading ? () => {} : onClose}
      className='max-w-md'
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onConfirm(referenceNo, note)
        }}
        className='space-y-4'
      >
        <div>
          <label htmlFor='reference-no' className='mb-1.5 block text-sm font-semibold text-forest'>
            Mã giao dịch ngân hàng <span className='font-normal text-muted'>(không bắt buộc)</span>
          </label>
          <input
            id='reference-no'
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            maxLength={50}
            placeholder='VD: FT26324123456'
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor='refund-note' className='mb-1.5 block text-sm font-semibold text-forest'>
            Ghi chú <span className='font-normal text-muted'>(không bắt buộc)</span>
          </label>
          <input
            id='refund-note'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={255}
            placeholder='VD: Chuyển khoản Vietcombank'
            className={inputClass}
          />
        </div>
        <div className='flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end'>
          <button type='button' onClick={onClose} disabled={loading} className='btn-outline'>
            Đóng
          </button>
          <button type='submit' disabled={loading} className='btn-primary'>
            {loading && <LoaderCircle size={16} className='animate-spin' />}
            Đã hoàn tiền
          </button>
        </div>
      </form>
    </Modal>
  )
}
