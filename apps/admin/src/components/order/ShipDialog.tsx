import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { AdminOrder, ShippingCarrier } from '@lib/api'
import { Modal } from '@components/ui'
import { SHIPPING_CARRIER } from './labels'

const TRACKING_PATTERN = /^[A-Za-z0-9._-]+$/

const inputClass =
  'w-full rounded-xl border border-clay bg-cream px-4 py-3 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'

interface Props {
  order: AdminOrder | null
  // ship = giao cho đơn vị vận chuyển; update = sửa thông tin khi đang giao
  mode: 'ship' | 'update'
  loading: boolean
  onConfirm: (carrier: ShippingCarrier, trackingCode: string | null) => void
  onClose: () => void
}

// US-19: Chọn đơn vị vận chuyển và nhập mã vận đơn (cửa hàng tự giao thì không cần mã)
export function ShipDialog({ order, mode, loading, onConfirm, onClose }: Props) {
  const [carrier, setCarrier] = useState<ShippingCarrier>(order?.shippingCarrier ?? 'ghn')
  const [trackingCode, setTrackingCode] = useState(order?.trackingCode ?? '')
  const [touched, setTouched] = useState(false)

  const code = trackingCode.trim()
  const error =
    carrier !== 'shop' && !code
      ? 'Vui lòng nhập mã vận đơn'
      : code && !TRACKING_PATTERN.test(code)
        ? 'Mã vận đơn chỉ gồm chữ, số và các ký tự . _ -'
        : ''

  const submit = () => {
    setTouched(true)
    if (!error) onConfirm(carrier, code || null)
  }

  return (
    <Modal
      open={!!order}
      title={mode === 'ship' ? 'Giao cho đơn vị vận chuyển' : 'Sửa thông tin vận chuyển'}
      description={
        order && (
          <>
            <strong className='text-forest'>{order.code}</strong> · {order.recipientName} · {order.shippingAddress}
          </>
        )
      }
      onClose={loading ? () => {} : onClose}
      className='max-w-md'
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className='space-y-4'
      >
        <div>
          <label htmlFor='carrier' className='mb-1.5 block text-sm font-semibold text-forest'>
            Đơn vị vận chuyển
          </label>
          <select
            id='carrier'
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as ShippingCarrier)}
            className={inputClass}
          >
            {(Object.keys(SHIPPING_CARRIER) as ShippingCarrier[]).map((value) => (
              <option key={value} value={value}>
                {SHIPPING_CARRIER[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor='tracking-code' className='mb-1.5 block text-sm font-semibold text-forest'>
            Mã vận đơn {carrier === 'shop' && <span className='font-normal text-muted'>(không bắt buộc)</span>}
          </label>
          <input
            id='tracking-code'
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            maxLength={50}
            placeholder='VD: GHN5K7Q2M9'
            aria-invalid={touched && !!error}
            className={inputClass}
          />
          {touched && error && <p className='mt-1.5 text-xs font-medium text-danger'>{error}</p>}
        </div>
        <div className='flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end'>
          <button type='button' onClick={onClose} disabled={loading} className='btn-outline'>
            Đóng
          </button>
          <button type='submit' disabled={loading} className='btn-primary'>
            {loading && <LoaderCircle size={16} className='animate-spin' />}
            {mode === 'ship' ? 'Bắt đầu giao' : 'Lưu'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
