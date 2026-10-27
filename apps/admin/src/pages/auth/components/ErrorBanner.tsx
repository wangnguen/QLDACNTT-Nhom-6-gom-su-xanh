import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

interface Props {
  message: string
  children?: ReactNode
}

export function ErrorBanner({ message, children }: Props) {
  if (!message) return null
  return (
    <div
      role='alert'
      className='flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 p-3.5 text-sm font-medium text-danger'
    >
      <CircleAlert size={18} className='mt-px shrink-0' />
      <div>
        {message}
        {children && <div className='mt-1.5'>{children}</div>}
      </div>
    </div>
  )
}
