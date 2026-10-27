import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  loading: boolean
  disabled?: boolean
  loadingText?: string
  children: ReactNode
}

export function SubmitButton({ loading, disabled, loadingText = 'Đang xử lý...', children }: Props) {
  return (
    <button type='submit' disabled={loading || disabled} className='btn-primary w-full'>
      {loading ? (
        <>
          <LoaderCircle size={18} className='animate-spin' />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
