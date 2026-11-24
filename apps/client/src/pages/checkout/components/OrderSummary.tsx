import type { CartLine } from '@lib/api'
import { FREE_SHIPPING_THRESHOLD, shippingFeeFor } from '@lib/schemas/order'
import { formatPrice } from '@lib/utils'
import { ProductImage } from '@components/product'

interface Props {
  // Chỉ các dòng mua được trong giỏ
  lines: CartLine[]
  // Số dòng có vấn đề (ngừng bán, hết hàng) — ở lại giỏ, không được đặt
  skippedCount: number
}

// Tóm tắt đơn ở trang đặt hàng: sản phẩm, tạm tính, phí giao hàng, tổng tiền (khớp cách server tính)
export function OrderSummary({ lines, skippedCount }: Props) {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const shippingFee = shippingFeeFor(subtotal)

  return (
    <>
      <h2 className='text-lg font-bold text-moss'>Đơn hàng của bạn</h2>
      <ul className='mt-4 max-h-80 space-y-3 overflow-y-auto pr-1'>
        {lines.map((line) => (
          <li key={line.productId} className='flex gap-3'>
            <div className='relative h-16 w-16 shrink-0'>
              <ProductImage
                src={line.product.imageUrl}
                alt={line.product.name}
                className='h-full w-full rounded-xl border border-clay/60'
              />
              <span className='absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-moss px-1 text-[11px] font-bold text-cream'>
                {line.quantity}
              </span>
            </div>
            <div className='min-w-0 flex-1'>
              <p className='line-clamp-2 text-sm font-semibold text-forest'>{line.product.name}</p>
              <p className='text-xs text-muted'>{formatPrice(line.product.price)}</p>
            </div>
            <p className='shrink-0 text-sm font-semibold'>{formatPrice(line.lineTotal)}</p>
          </li>
        ))}
      </ul>

      {skippedCount > 0 && (
        <p className='mt-3 rounded-xl bg-warning/10 p-3 text-xs text-warning'>
          {skippedCount} sản phẩm ngừng bán hoặc không đủ hàng sẽ ở lại giỏ, không được đặt.
        </p>
      )}

      <dl className='mt-4 space-y-2.5 border-t border-clay/50 pt-4 text-sm'>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted'>Tạm tính</dt>
          <dd className='font-semibold'>{formatPrice(subtotal)}</dd>
        </div>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted'>Phí giao hàng</dt>
          <dd className='font-semibold'>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</dd>
        </div>
        {shippingFee > 0 && (
          <p className='text-xs text-muted'>
            Mua thêm {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} để được miễn phí giao hàng.
          </p>
        )}
        <div className='flex items-baseline justify-between gap-4 border-t border-clay/50 pt-3'>
          <dt className='font-semibold text-forest'>Tổng cộng</dt>
          <dd className='font-display text-2xl font-bold text-teal'>{formatPrice(subtotal + shippingFee)}</dd>
        </div>
      </dl>
    </>
  )
}
