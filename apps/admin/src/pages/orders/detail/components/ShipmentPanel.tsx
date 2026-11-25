import { useState } from 'react'
import { PackageCheck, Pencil, Truck, Undo2 } from 'lucide-react'
import { ordersService, type AdminOrderDetail, type ShipmentBody } from '@lib/api'
import { formatDateTime, formatPrice } from '@lib/utils'
import { ConfirmDialog } from '@components/ui'
import { ReturnDialog, SHIPMENT_SUCCESS, SHIPPING_CARRIER, ShipDialog } from '@components/order'
import { useOrderDetailStore } from '../store'

type Dialog = 'ship' | 'update' | 'deliver' | 'return' | null

// US-19: Vận chuyển của đơn — đơn vị vận chuyển, mã vận đơn và các bước giao hàng
export function ShipmentPanel({ order }: { order: AdminOrderDetail }) {
  const { updating, run } = useOrderDetailStore()
  const [dialog, setDialog] = useState<Dialog>(null)

  const submit = async (body: ShipmentBody) => {
    const ok = await run(
      () => ordersService.updateShipment(order.id, body),
      `${SHIPMENT_SUCCESS[body.action]} — ${order.code}`,
      'Không cập nhật được vận chuyển'
    )
    if (ok) setDialog(null)
  }

  const collect = order.paymentMethod === 'cod' && order.paymentStatus === 'unpaid'

  return (
    <>
      {order.shippingCarrier ? (
        <dl className='space-y-2 text-sm'>
          <div className='flex justify-between gap-3'>
            <dt className='text-muted'>Đơn vị</dt>
            <dd className='text-right font-semibold'>{SHIPPING_CARRIER[order.shippingCarrier]}</dd>
          </div>
          {order.trackingCode && (
            <div className='flex justify-between gap-3'>
              <dt className='text-muted'>Mã vận đơn</dt>
              <dd className='font-mono font-semibold text-teal'>{order.trackingCode}</dd>
            </div>
          )}
          {order.shippedAt && (
            <div className='flex justify-between gap-3'>
              <dt className='text-muted'>Gửi đi</dt>
              <dd>{formatDateTime(order.shippedAt)}</dd>
            </div>
          )}
          {order.deliveryNote && <p className='rounded-xl bg-danger/5 p-3 text-danger'>{order.deliveryNote}</p>}
        </dl>
      ) : (
        <p className='text-sm text-muted'>
          {order.status === 'confirmed'
            ? 'Đơn đã xác nhận, chờ giao cho đơn vị vận chuyển.'
            : order.status === 'pending'
              ? 'Xác nhận đơn trước khi giao hàng.'
              : 'Đơn không giao.'}
        </p>
      )}

      {order.status === 'confirmed' && (
        <button type='button' onClick={() => setDialog('ship')} disabled={updating} className='btn-primary mt-4 w-full'>
          <Truck size={18} />
          Giao cho đơn vị vận chuyển
        </button>
      )}
      {order.status === 'shipping' && (
        <div className='mt-4 space-y-2'>
          <button type='button' onClick={() => setDialog('deliver')} disabled={updating} className='btn-primary w-full'>
            <PackageCheck size={18} />
            Đã giao thành công
          </button>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setDialog('update')}
              disabled={updating}
              className='btn-outline flex-1'
            >
              <Pencil size={15} />
              Sửa
            </button>
            <button
              type='button'
              onClick={() => setDialog('return')}
              disabled={updating}
              className='inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-50'
            >
              <Undo2 size={15} />
              Hoàn hàng
            </button>
          </div>
        </div>
      )}

      {(dialog === 'ship' || dialog === 'update') && (
        <ShipDialog
          order={order}
          mode={dialog}
          loading={updating}
          onConfirm={(shippingCarrier, trackingCode) => submit({ action: dialog, shippingCarrier, trackingCode })}
          onClose={() => setDialog(null)}
        />
      )}
      <ReturnDialog
        key={dialog === 'return' ? 'open' : 'closed'}
        order={dialog === 'return' ? order : null}
        loading={updating}
        onConfirm={(reason) => submit({ action: 'return', reason })}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'deliver'}
        title='Xác nhận đã giao hàng?'
        message={
          <>
            Đơn <strong>{order.code}</strong> đã tới tay {order.recipientName}.
            {collect && ` Ghi nhận đã thu ${formatPrice(order.total)} tiền mặt.`}
          </>
        }
        confirmText='Đã giao'
        tone='primary'
        loading={updating}
        onConfirm={() => submit({ action: 'deliver' })}
        onClose={() => setDialog(null)}
      />
    </>
  )
}
