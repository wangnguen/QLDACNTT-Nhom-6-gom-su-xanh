import type { ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode
  action?: ReactNode
}

// Thông tin chỉ xem (vd: email hiện tại) — cùng khung với FieldInput để form thẳng hàng
export function ReadonlyField({ label, value, action }: Props) {
  return (
    <div>
      <p className='mb-1.5 block text-sm font-semibold text-forest'>{label}</p>
      <div className='flex items-center justify-between gap-3 rounded-xl border border-clay/70 bg-sand/60 px-4 py-3'>
        <div className='flex min-w-0 items-center gap-1.5 text-[15px] text-ink'>{value}</div>
        {action && <div className='shrink-0 text-sm'>{action}</div>}
      </div>
    </div>
  )
}
