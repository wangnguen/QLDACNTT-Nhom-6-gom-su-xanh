import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@lib/utils'

interface Props {
  open: boolean
  title: string
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  className?: string
}

// Hộp thoại nổi giữa màn hình (mobile: dính đáy); Esc hoặc bấm ra ngoài để đóng
export function Modal({ open, title, description, onClose, children, className }: Props) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-forest/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6'
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={cn(
          'max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-[0_24px_64px_rgba(28,61,30,0.25)] sm:p-7',
          className
        )}
      >
        <div className='mb-5 flex items-start justify-between gap-4'>
          <div>
            <h2 id={titleId} className='font-display text-2xl font-bold text-moss'>
              {title}
            </h2>
            {description && <p className='mt-1 text-sm text-ink'>{description}</p>}
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Đóng'
            className='-mt-1 -mr-2 rounded-full p-2 text-muted transition-colors hover:bg-moss/5 hover:text-moss'
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
