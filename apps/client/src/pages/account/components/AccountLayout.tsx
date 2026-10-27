import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, Mail, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@lib/utils'
import { useAuthStore } from '@stores/authStore'

const NAV_ITEMS = [
  { to: '/account', label: 'Hồ sơ cá nhân', icon: UserRound, end: true },
  { to: '/account/email', label: 'Đổi email', icon: Mail, end: false },
  { to: '/account/password', label: 'Đổi mật khẩu', icon: KeyRound, end: false }
]

const navItemClass =
  'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors'

// Khung trang "Tài khoản của tôi": menu bên trái (mobile: thanh tab cuộn ngang) + nội dung từng mục
export function AccountLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14'>
      <h1 className='font-display text-4xl font-bold text-moss'>Tài khoản của tôi</h1>

      <div className='mt-8 grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start'>
        <aside className='min-w-0 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-4 shadow-sm'>
          <div className='flex items-center gap-3 px-1 pb-4'>
            <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-moss font-display text-xl font-bold text-cream'>
              {user.fullName.trim().charAt(0).toUpperCase()}
            </span>
            <div className='min-w-0'>
              <p className='truncate font-bold'>{user.fullName}</p>
              <p className='truncate text-sm text-muted'>{user.email}</p>
            </div>
          </div>

          <nav
            aria-label='Mục tài khoản'
            className='-mx-1 flex gap-1 overflow-x-auto border-t border-clay/50 px-1 pt-3 [scrollbar-width:none] lg:flex-col'
          >
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(navItemClass, isActive ? 'bg-moss text-cream' : 'text-moss hover:bg-moss/5')
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button type='button' onClick={handleLogout} className={cn(navItemClass, 'text-danger hover:bg-danger/5')}>
              <LogOut size={18} />
              Đăng xuất
            </button>
          </nav>
        </aside>

        <section className='min-w-0 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm sm:p-8'>
          <Outlet />
        </section>
      </div>
    </div>
  )
}
