import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Modal } from './Modal'

interface Props {
  open: boolean
  title: string
  message: ReactNode
  confirmText?: string
  loading?: boolean
  // Biết trước thao tác sẽ không thực hiện được (vd danh mục còn sản phẩm)
  disabled?: boolean
  onConfirm: () => void
  onClose: () => void
}

// Xác nhận thao tác không hoàn tác được (xoá)
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Xoá',
  loading,
  disabled,
  onConfirm,
  onClose
}: Props) {
  return (
    <Modal open={open} title={title} onClose={loading ? () => {} : onClose} className='max-w-md'>
      <div className='text-ink'>{message}</div>
      <div className='mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <button type='button' onClick={onClose} disabled={loading} className='btn-outline'>
          Huỷ
        </button>
        <button
          type='button'
          onClick={onConfirm}
          disabled={loading || disabled}
          className='inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {loading && <LoaderCircle size={16} className='animate-spin' />}
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
