import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { Logo } from '../Logo'

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, initialized, logout } = useAuthStore()
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
          <Logo />

          {initialized && (
            <nav className='flex items-center gap-2 sm:gap-3'>
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
                  <Link to='/login' className='btn-outline'>
                    Đăng nhập
                  </Link>
                  <Link to='/register' className='btn-primary px-5 py-2.5 text-sm'>
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
