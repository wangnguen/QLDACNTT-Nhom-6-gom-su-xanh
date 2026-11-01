import type { SelectHTMLAttributes } from 'react'
import { ChevronDown, CircleAlert } from 'lucide-react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@lib/utils'

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, keyof UseFormRegisterReturn> {
  id: string
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: FieldError
  registration: UseFormRegisterReturn
}

export function SelectField({ id, label, options, placeholder, error, registration, className, ...rest }: Props) {
  const messageId = `${id}-message`

  return (
    <div className={className}>
      <label htmlFor={id} className='mb-1.5 block text-sm font-semibold text-forest'>
        {label}
      </label>
      <div className='relative'>
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? messageId : undefined}
          className={cn(
            'w-full appearance-none rounded-xl border bg-cream py-3 pr-10 pl-4 text-[15px] text-forest outline-none transition focus:ring-4',
            error ? 'border-danger focus:ring-danger/15' : 'border-clay focus:border-teal focus:ring-teal/15'
          )}
          {...rest}
          {...registration}
        >
          {placeholder !== undefined && <option value=''>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className='pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted'
          aria-hidden
        />
      </div>
      {error && (
        <p id={messageId} className='mt-1.5 flex items-start gap-1 text-xs font-medium text-danger'>
          <CircleAlert size={14} className='mt-px shrink-0' />
          {error.message}
        </p>
      )}
    </div>
  )
}
