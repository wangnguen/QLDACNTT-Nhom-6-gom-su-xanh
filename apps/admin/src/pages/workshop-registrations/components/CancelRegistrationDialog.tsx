import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { WorkshopRegistration } from '@lib/api'
import { Modal } from '@components/ui'

interface Props {
  registration: WorkshopRegistration | null
  loading: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

// Huỷ đăng ký kèm lý do — khách sẽ thấy lý do trong "Lịch workshop của tôi"
export function CancelRegistrationDialog({ registration, loading, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={!!registration}
      title='Huỷ đăng ký?'
      description={
        registration && (
          <>
            <strong className='text-forest'>{registration.code}</strong> · {registration.contactName} ·{' '}
            {registration.seats} chỗ — lớp được trả lại chỗ sau khi huỷ.
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
        placeholder='VD: Lớp tạm hoãn vì nghệ nhân ốm'
        className='w-full resize-y rounded-xl border border-clay bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
      />
      <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <button type='button' onClick={onClose} disabled={loading} className='btn-outline'>
          Giữ lại
        </button>
        <button
          type='button'
          onClick={() => onConfirm(reason)}
          disabled={loading}
          className='inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {loading && <LoaderCircle size={16} className='animate-spin' />}
          Huỷ đăng ký
        </button>
      </div>
    </Modal>
  )
}
