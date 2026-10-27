import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, LayoutDashboard, LogOut, Package, ReceiptText, Users, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { cn } from '@lib/utils'
import { Logo } from '../Logo'

const NAV_ITEMS = [{ to: '/', label: 'Tổng quan', icon: LayoutDashboard }]

// Các module sẽ làm ở sprint sau — hiển thị trước để định hình bố cục
const UPCOMING_ITEMS = [
  { label: 'Sản phẩm', icon: Package },
  { label: 'Đơn hàng', icon: ReceiptText },
  { label: 'Workshop', icon: CalendarDays },
  { label: 'Bài viết', icon: BookOpen },
  { label: 'Khách hàng', icon: Users }
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Đã đăng xuất')
    navigate('/login', { replace: true })
  }

  return (
    <div className='flex min-h-screen'>
      <aside className='hidden w-64 shrink-0 flex-col bg-moss px-4 py-6 text-cream md:flex'>
        <Logo inverted className='px-2' />

        <nav className='mt-10 flex-1 space-y-1'>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-cream text-moss' : 'text-mint hover:bg-cream/10'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          <p className='px-3 pt-6 pb-2 text-xs font-bold tracking-wider text-mint/60 uppercase'>Sắp ra mắt</p>
          {UPCOMING_ITEMS.map(({ label, icon: Icon }) => (
            <span
              key={label}
              aria-disabled
              className='flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-mint/45'
            >
              <Icon size={18} />
              {label}
            </span>
          ))}
        </nav>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex h-16 items-center justify-between gap-4 border-b border-clay/60 bg-cream px-4 sm:px-8'>
          <div className='md:hidden'>
            <Logo />
          </div>
          <div className='hidden text-sm text-muted md:block'>
            Đăng nhập với quyền <span className='font-semibold text-moss'>Quản trị viên</span>
          </div>
          <div className='flex items-center gap-3'>
            <span className='hidden max-w-[14rem] truncate text-sm font-semibold sm:inline'>{user?.fullName}</span>
            <button type='button' onClick={handleLogout} className='btn-outline'>
              <LogOut size={16} />
              <span className='hidden sm:inline'>Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className='flex-1 px-4 py-8 sm:px-8'>{children}</main>
      </div>
    </div>
  )
}
