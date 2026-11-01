import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LoaderCircle, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import type { ProductDetail } from '@lib/api'
import { QuantityStepper } from '@components/product'
import { useAuthStore } from '@stores/authStore'
import { useCartStore } from '@stores/cartStore'

// Giới hạn mỗi sản phẩm trong giỏ (khớp với server)
const MAX_PER_PRODUCT = 99

// US-10: Chọn số lượng và thêm vào giỏ — khách chưa đăng nhập được chuyển sang trang đăng nhập rồi quay lại
export function AddToCart({ product }: { product: ProductDetail }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const inCart = useCartStore((s) => s.cart?.items.find((item) => item.productId === product.id)?.quantity ?? 0)
  const pending = useCartStore((s) => s.pendingIds.includes(product.id))
  const addItem = useCartStore((s) => s.addItem)
  const navigate = useNavigate()
  const location = useLocation()
  const [quantity, setQuantity] = useState(1)

  if (product.stock === 0) {
    return (
      <button type='button' disabled className='btn-primary w-full sm:w-auto'>
        Tạm hết hàng
      </button>
    )
  }

  // Còn được thêm bao nhiêu: không vượt tồn kho và giới hạn mỗi sản phẩm, trừ phần đã có trong giỏ
  const maxAddable = Math.max(0, Math.min(product.stock, MAX_PER_PRODUCT) - inCart)
  const value = Math.min(quantity, Math.max(1, maxAddable))

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    if (await addItem(product.id, value)) {
      setQuantity(1)
      toast.success(`Đã thêm ${value} "${product.name}" vào giỏ hàng`, {
        action: { label: 'Xem giỏ hàng', onClick: () => navigate('/cart') }
      })
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <QuantityStepper
          value={value}
          max={Math.max(1, maxAddable)}
          onChange={setQuantity}
          disabled={pending || maxAddable === 0}
        />
        <button
          type='button'
          onClick={handleAdd}
          disabled={pending || maxAddable === 0}
          className='btn-primary min-w-52 flex-1 sm:flex-none'
        >
          {pending ? <LoaderCircle size={18} className='animate-spin' /> : <ShoppingBag size={18} />}
          Thêm vào giỏ hàng
        </button>
      </div>
      {inCart > 0 && (
        <p className='text-sm text-ink'>
          {maxAddable === 0 ? 'Bạn đã thêm hết số lượng còn lại vào giỏ.' : `Giỏ hàng đã có ${inCart} sản phẩm này.`}{' '}
          <Link to='/cart' className='link'>
            Xem giỏ hàng
          </Link>
        </p>
      )}
    </div>
  )
}
