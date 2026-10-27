import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@lib/utils'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, keyof UseFormRegisterReturn> {
  id: string
  label: ReactNode
  error?: FieldError
  hint?: string
  registration: UseFormRegisterReturn
}

// Ô nhập liệu có label + lỗi; type='password' tự có nút ẩn/hiện mật khẩu
export function FieldInput({ id, label, type = 'text', error, hint, registration, className, ...rest }: Props) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const messageId = `${id}-message`

  return (
    <div className={className}>
      <label htmlFor={id} className='mb-1.5 block text-sm font-semibold text-forest'>
        {label}
      </label>
      <div className='relative'>
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            'w-full rounded-xl border bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:ring-4',
            error ? 'border-danger focus:ring-danger/15' : 'border-clay focus:border-teal focus:ring-teal/15',
            isPassword && 'pr-12'
          )}
          {...rest}
          {...registration}
        />
        {isPassword && (
          <button
            type='button'
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className='absolute inset-y-0 right-0 flex items-center px-4 text-muted hover:text-teal'
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={messageId} className='mt-1.5 flex items-start gap-1 text-xs font-medium text-danger'>
          <CircleAlert size={14} className='mt-px shrink-0' />
          {error.message}
        </p>
      ) : (
        hint && (
          <p id={messageId} className='mt-1.5 text-xs text-muted'>
            {hint}
          </p>
        )
      )}
    </div>
  )
}
