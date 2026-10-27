import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { FullPageSpinner } from './Spinner'

// Trang chỉ dành cho khách chưa đăng nhập (đăng nhập, đăng ký, quên mật khẩu...)
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()

  if (!initialized) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to='/' replace />
  return <>{children}</>
}
