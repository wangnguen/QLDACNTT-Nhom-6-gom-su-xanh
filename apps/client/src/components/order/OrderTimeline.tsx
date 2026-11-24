import { Check, PackageCheck, Truck, Undo2, X } from 'lucide-react'
import type { OrderDetail } from '@lib/api'
import { cn, formatDateTime } from '@lib/utils'

type Step = { label: string; at: string | null; done: boolean; tone?: 'danger' | 'muted'; icon?: typeof Check }

// Các mốc của đơn: đặt hàng → (thanh toán) → xác nhận → giao cho vận chuyển → đã giao; hoặc kết thúc ở huỷ / hoàn hàng
function stepsOf(order: OrderDetail): Step[] {
  const steps: Step[] = [{ label: 'Đặt hàng', at: order.placedAt, done: true }]
  if (order.paymentMethod === 'vnpay') {
    steps.push({ label: 'Thanh toán trực tuyến', at: order.paidAt, done: !!order.paidAt })
  }

  if (order.status === 'cancelled') {
    if (order.confirmedAt) steps.push({ label: 'Cửa hàng xác nhận', at: order.confirmedAt, done: true })
    steps.push({
      label: order.cancelledBy === 'admin' ? 'Cửa hàng đã huỷ đơn' : 'Bạn đã huỷ đơn',
      at: order.cancelledAt,
      done: true,
      tone: 'muted',
      icon: X
    })
    return steps
  }

  steps.push(
    { label: 'Cửa hàng xác nhận', at: order.confirmedAt, done: !!order.confirmedAt },
    { label: 'Giao cho đơn vị vận chuyển', at: order.shippedAt, done: !!order.shippedAt, icon: Truck }
  )
  if (order.status === 'returned') {
    steps.push({ label: 'Giao không thành công', at: order.returnedAt, done: true, tone: 'danger', icon: Undo2 })
  } else {
    steps.push({ label: 'Đã giao hàng', at: order.deliveredAt, done: !!order.deliveredAt, icon: PackageCheck })
  }
  return steps
}

// US-15: Tiến trình đơn hàng
export function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = stepsOf(order)
  return (
    <ol className='space-y-0'>
      {steps.map((step, i) => {
        const Icon = step.icon ?? Check
        const last = i === steps.length - 1
        return (
          <li key={step.label} className='relative flex gap-3 pb-5 last:pb-0'>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5',
                  steps[i + 1].done ? 'bg-teal/50' : 'bg-clay/60'
                )}
              />
            )}
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                !step.done && 'border-2 border-dashed border-clay text-clay',
                step.done && !step.tone && 'bg-teal text-cream',
                step.tone === 'danger' && 'bg-danger text-cream',
                step.tone === 'muted' && 'bg-muted text-cream'
              )}
            >
              <Icon size={16} aria-hidden />
            </span>
            <div className='pt-1'>
              <p className={cn('text-sm font-semibold', step.done ? 'text-forest' : 'text-muted')}>{step.label}</p>
              {step.at && <p className='text-xs text-muted'>{formatDateTime(step.at)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
