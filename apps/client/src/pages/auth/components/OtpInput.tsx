import { useRef } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'
import { CircleAlert } from 'lucide-react'
import { cn } from '@lib/utils'

const LENGTH = 6

interface Props {
  value: string
  onChange: (otp: string) => void
  error?: string
  label?: string
}

// 6 ô nhập mã OTP: tự nhảy ô, hỗ trợ dán cả mã, phím mũi tên và Backspace
export function OtpInput({ value, onChange, error, label = 'Mã OTP' }: Props) {
  const digits = Array.from({ length: LENGTH }, (_, i) => (/^\d$/.test(value[i] ?? '') ? value[i] : ''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const focusAt = (i: number) => inputs.current[Math.max(0, Math.min(i, LENGTH - 1))]?.focus()

  const handleChange = (index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    onChange(next.join(''))
    if (digit) focusAt(index + 1)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]) focusAt(index - 1)
    if (e.key === 'ArrowLeft') focusAt(index - 1)
    if (e.key === 'ArrowRight') focusAt(index + 1)
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!pasted) return
    onChange(pasted)
    focusAt(pasted.length)
  }

  return (
    <fieldset>
      <legend className='mb-1.5 block text-sm font-semibold text-forest'>{label}</legend>
      <div className='flex justify-between gap-2'>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            type='text'
            inputMode='numeric'
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            aria-label={`Chữ số thứ ${i + 1}`}
            aria-invalid={!!error}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              'h-14 w-full min-w-0 rounded-xl border text-center text-2xl font-bold text-moss outline-none transition focus:ring-4',
              error
                ? 'border-danger bg-cream focus:ring-danger/15'
                : digit
                  ? 'border-sage bg-mint/20 focus:border-teal focus:ring-teal/15'
                  : 'border-clay bg-cream focus:border-teal focus:ring-teal/15'
            )}
          />
        ))}
      </div>
      {error && (
        <p className='mt-1.5 flex items-start gap-1 text-xs font-medium text-danger'>
          <CircleAlert size={14} className='mt-px shrink-0' />
          {error}
        </p>
      )}
    </fieldset>
  )
}
