import { cn } from '@lib/utils'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  id?: string
}

// Công tắc bật/tắt; `label` dùng cho trình đọc màn hình
export function Switch({ checked, onChange, label, disabled, id }: Props) {
  return (
    <button
      id={id}
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-teal' : 'bg-clay'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-cream shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}
