import { Link } from 'react-router-dom'
import { CircleAlert, Trash2 } from 'lucide-react'
import type { CartItemIssue, CartLine } from '@lib/api'
import { cn, formatPrice } from '@lib/utils'
import { ProductImage, QuantityStepper } from '@components/product'
import { useCartStore } from '@stores/cartStore'

// Giới hạn mỗi sản phẩm trong giỏ (khớp với server)
const MAX_PER_PRODUCT = 99

const ISSUE_MESSAGES: Record<CartItemIssue, string> = {
  unavailable: 'Sản phẩm đã ngừng bán — vui lòng xoá khỏi giỏ hàng',
  out_of_stock: 'Sản phẩm đã hết hàng',
  not_enough_stock: 'Số lượng trong giỏ vượt quá số hàng còn lại'
}

export function CartLineItem({ line }: { line: CartLine }) {
  const { product } = line
  const pending = useCartStore((s) => s.pendingIds.includes(line.productId))
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  // Sản phẩm ngừng bán thì trang chi tiết trả 404 — không gắn link
  const linkable = line.issue !== 'unavailable'
  const canChangeQuantity = linkable && line.issue !== 'out_of_stock'

  const image = (
    <ProductImage
      src={product.imageUrl}
      alt={product.name}
      className={cn('h-24 w-24 rounded-xl sm:h-28 sm:w-28', line.issue && 'grayscale')}
    />
  )

  return (
    <li className={cn('flex gap-4 py-5 transition-opacity', pending && 'opacity-60')}>
      {linkable ? (
        <Link to={`/products/${product.slug}`} className='shrink-0' tabIndex={-1} aria-hidden>
          {image}
        </Link>
      ) : (
        <div className='shrink-0'>{image}</div>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-xs font-bold tracking-wider text-leaf uppercase'>{product.category.name}</p>
          {linkable ? (
            <Link to={`/products/${product.slug}`} className='font-semibold text-forest hover:text-teal'>
              {product.name}
            </Link>
          ) : (
            <p className='font-semibold text-forest'>{product.name}</p>
          )}
          <p className='mt-1 text-sm text-muted'>{formatPrice(product.price)} / sản phẩm</p>
          {line.issue && (
            <div className='mt-2 flex items-start gap-1.5 text-sm font-medium text-danger'>
              <CircleAlert size={16} className='mt-0.5 shrink-0' />
              <p>
                {ISSUE_MESSAGES[line.issue]}
                {line.issue === 'not_enough_stock' && (
                  <>
                    {' '}
                    <button
                      type='button'
                      onClick={() => updateQuantity(line.productId, product.stock)}
                      disabled={pending}
                      className='font-semibold text-teal underline-offset-4 hover:underline'
                    >
                      Giảm còn {product.stock}
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <div className='flex items-center justify-between gap-4 sm:flex-col sm:items-end'>
          <p className={cn('font-display text-xl font-bold', line.issue ? 'text-muted line-through' : 'text-moss')}>
            {formatPrice(line.lineTotal)}
          </p>
          <div className='flex items-center gap-2'>
            {canChangeQuantity && (
              <QuantityStepper
                size='sm'
                value={line.quantity}
                // Đang vượt tồn kho thì vẫn giữ số lượng hiện tại để giảm dần được
                max={Math.max(line.quantity, Math.min(product.stock, MAX_PER_PRODUCT))}
                onChange={(quantity) => updateQuantity(line.productId, quantity)}
                disabled={pending}
                label={`Số lượng ${product.name}`}
              />
            )}
            <button
              type='button'
              onClick={() => removeItem(line.productId)}
              disabled={pending}
              className='inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/5 hover:text-danger disabled:opacity-40'
              aria-label={`Xoá ${product.name} khỏi giỏ hàng`}
              title='Xoá khỏi giỏ hàng'
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
