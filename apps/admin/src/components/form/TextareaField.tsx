import type { TextareaHTMLAttributes } from 'react'
import { CircleAlert } from 'lucide-react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@lib/utils'

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof UseFormRegisterReturn> {
  id: string
  label: string
  error?: FieldError
  hint?: string
  registration: UseFormRegisterReturn
}

export function TextareaField({ id, label, error, hint, registration, className, rows = 4, ...rest }: Props) {
  const messageId = `${id}-message`

  return (
    <div className={className}>
      <label htmlFor={id} className='mb-1.5 block text-sm font-semibold text-forest'>
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          'w-full resize-y rounded-xl border bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:ring-4',
          error ? 'border-danger focus:ring-danger/15' : 'border-clay focus:border-teal focus:ring-teal/15'
        )}
        {...rest}
        {...registration}
      />
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
