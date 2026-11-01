import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react'
import { formatPrice } from '@lib/utils'
import { useCartStore } from '@stores/cartStore'
import { CartLineItem } from './components/CartLineItem'

// US-10: Quản lý giỏ hàng
export default function CartPage() {
  const { cart, loading, fetch, clear } = useCartStore()
  const [confirmClear, setConfirmClear] = useState(false)

  // Luôn tải lại khi mở trang để giá, tồn kho, trạng thái sản phẩm là mới nhất
  useEffect(() => {
    fetch()
  }, [fetch])

  const handleClear = async () => {
    await clear()
    setConfirmClear(false)
  }

  if (!cart) {
    return (
      <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14' aria-busy={loading} aria-label='Đang tải giỏ hàng'>
        <div className='h-10 w-48 animate-pulse rounded bg-cream' />
        <div className='mt-8 h-64 animate-pulse rounded-[var(--radius-organic)] bg-cream' />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center'>
        <span className='flex h-20 w-20 items-center justify-center rounded-full bg-moss/10 text-moss'>
          <ShoppingBag size={36} aria-hidden />
        </span>
        <h1 className='mt-2 font-display text-3xl font-bold text-moss'>Giỏ hàng đang trống</h1>
        <p className='text-ink'>Dạo một vòng cửa hàng và chọn vài món gốm bạn thích nhé.</p>
        <Link to='/products' className='btn-primary mt-4'>
          Xem sản phẩm
        </Link>
      </div>
    )
  }

  const issueCount = cart.items.filter((line) => line.issue).length

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14'>
      <Link
        to='/products'
        className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'
      >
        <ArrowLeft size={16} />
        Tiếp tục mua sắm
      </Link>
      <h1 className='mt-3 font-display text-4xl font-bold text-moss'>
        Giỏ hàng <span className='text-2xl font-semibold text-muted'>({cart.totalQuantity})</span>
      </h1>

      <div className='mt-8 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start'>
        <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream px-5 shadow-sm sm:px-7'>
          <ul className='divide-y divide-clay/50'>
            {cart.items.map((line) => (
              <CartLineItem key={line.productId} line={line} />
            ))}
          </ul>

          <div className='flex flex-wrap items-center justify-end gap-2 border-t border-clay/50 py-4'>
            {confirmClear ? (
              <>
                <span className='text-sm text-ink'>Xoá toàn bộ giỏ hàng?</span>
                <button type='button' onClick={() => setConfirmClear(false)} className='btn-outline'>
                  Huỷ
                </button>
                <button
                  type='button'
                  onClick={handleClear}
                  className='inline-flex items-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-cream hover:bg-danger/90'
                >
                  Xoá tất cả
                </button>
              </>
            ) : (
              <button
                type='button'
                onClick={() => setConfirmClear(true)}
                className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger'
              >
                <Trash2 size={16} />
                Xoá tất cả
              </button>
            )}
          </div>
        </section>

        <aside className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm lg:sticky lg:top-24'>
          <h2 className='text-lg font-bold text-moss'>Tóm tắt</h2>
          <dl className='mt-4 space-y-3 text-sm'>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted'>Số sản phẩm</dt>
              <dd className='font-semibold'>{cart.totalQuantity}</dd>
            </div>
            <div className='flex items-baseline justify-between gap-4 border-t border-clay/50 pt-3'>
              <dt className='font-semibold text-forest'>Tạm tính</dt>
              <dd className='font-display text-2xl font-bold text-teal'>{formatPrice(cart.subtotal)}</dd>
            </div>
          </dl>
          {issueCount > 0 && (
            <p className='mt-3 rounded-xl bg-warning/10 p-3 text-xs text-warning'>
              {issueCount} sản phẩm không mua được hiện không được tính vào tạm tính.
            </p>
          )}
          <p className='mt-3 text-xs text-muted'>Phí vận chuyển sẽ được tính khi đặt hàng.</p>
          <button type='button' disabled className='btn-primary mt-6 w-full'>
            Đặt hàng
          </button>
          <p className='mt-2 text-center text-xs text-muted'>Chức năng đặt hàng sẽ có ở bản cập nhật tiếp theo.</p>
        </aside>
      </div>
    </div>
  )
}
