import { Banknote, CreditCard } from 'lucide-react'
import type { PaymentMethod, PaymentMethodOption } from '@lib/api'
import { cn } from '@lib/utils'
import { PAYMENT_METHOD_LABEL } from '@components/order'

const DESCRIPTION: Record<PaymentMethod, string> = {
  cod: 'Trả tiền mặt cho nhân viên giao hàng khi nhận được gốm.',
  vnpay: 'Thẻ ATM nội địa, thẻ quốc tế hoặc quét mã QR qua cổng VNPay.'
}

const ICON = { cod: Banknote, vnpay: CreditCard }

interface Props {
  methods: PaymentMethodOption[]
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
}

// Chọn phương thức thanh toán; VNPay bị tắt khi server chưa cấu hình cổng thanh toán
export function PaymentMethodPicker({ methods, value, onChange, disabled }: Props) {
  return (
    <fieldset disabled={disabled}>
      <legend className='mb-2 text-sm font-semibold text-forest'>Phương thức thanh toán</legend>
      <div className='grid gap-3 sm:grid-cols-2'>
        {methods.map((option) => {
          const Icon = ICON[option.method]
          const selected = value === option.method
          return (
            <label
              key={option.method}
              className={cn(
                'relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors',
                selected ? 'border-teal bg-teal/5 ring-2 ring-teal/20' : 'border-clay hover:border-moss/40',
                !option.enabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type='radio'
                name='paymentMethod'
                value={option.method}
                checked={selected}
                disabled={!option.enabled}
                onChange={() => onChange(option.method)}
                className='sr-only'
              />
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  selected ? 'bg-teal text-cream' : 'bg-moss/10 text-moss'
                )}
              >
                <Icon size={20} aria-hidden />
              </span>
              <span className='min-w-0'>
                <span className='block text-sm font-semibold text-forest'>{PAYMENT_METHOD_LABEL[option.method]}</span>
                <span className='mt-0.5 block text-xs text-ink'>
                  {option.enabled ? DESCRIPTION[option.method] : 'Tạm thời chưa nhận thanh toán trực tuyến.'}
                </span>
                {option.sandbox && (
                  <span className='mt-1.5 inline-block rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-bold text-warning'>
                    Cổng thanh toán thử nghiệm
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
