import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, ShoppingBag, Store, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { useCartStore } from '@stores/cartStore'
import { cn } from '@lib/utils'
import { Logo } from '../Logo'

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, initialized, logout } = useAuthStore()
  const cartCount = useCartStore((s) => s.cart?.totalQuantity ?? 0)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='sticky top-0 z-20 border-b border-clay/60 bg-cream/90 backdrop-blur'>
        <div className='mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6'>
          <Logo compact />

          {initialized && (
            <nav className='flex items-center gap-1.5 sm:gap-3'>
              {/* US-08: Xem danh sách sản phẩm — mobile chỉ hiện biểu tượng */}
              <NavLink
                to='/products'
                aria-label='Sản phẩm'
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                    isActive ? 'bg-moss/10 text-moss' : 'text-moss hover:bg-moss/5'
                  )
                }
              >
                <Store size={18} />
                <span className='hidden sm:inline'>Sản phẩm</span>
              </NavLink>

              {/* US-10: Giỏ hàng — khách chưa đăng nhập bấm vào sẽ được chuyển sang trang đăng nhập */}
              <NavLink
                to='/cart'
                aria-label={cartCount > 0 ? `Giỏ hàng, ${cartCount} sản phẩm` : 'Giỏ hàng'}
                className={({ isActive }) =>
                  cn(
                    'relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                    isActive ? 'bg-moss/10 text-moss' : 'text-moss hover:bg-moss/5'
                  )
                }
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className='absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-bold text-cream ring-2 ring-cream'>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </NavLink>

              {isAuthenticated && user ? (
                <>
                  <Link
                    to='/account'
                    className='inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-moss hover:bg-moss/5'
                  >
                    <UserRound size={18} />
                    <span className='hidden max-w-[12rem] truncate sm:inline'>{user.fullName}</span>
                  </Link>
                  <button type='button' onClick={handleLogout} className='btn-outline'>
                    <LogOut size={16} />
                    <span className='hidden sm:inline'>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to='/login' className='btn-outline whitespace-nowrap'>
                    Đăng nhập
                  </Link>
                  <Link to='/register' className='btn-primary px-5 py-2.5 text-sm whitespace-nowrap'>
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className='flex-1'>{children}</main>

      <footer className='bg-moss py-6 text-center text-sm text-mint/80'>© 2026 Gốm Sứ Xanh</footer>
    </div>
  )
}
