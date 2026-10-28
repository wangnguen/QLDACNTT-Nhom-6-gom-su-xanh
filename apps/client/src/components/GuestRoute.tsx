import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { FullPageSpinner } from './Spinner'

// Trang chỉ dành cho khách chưa đăng nhập (đăng nhập, đăng ký, quên mật khẩu...)
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) return <FullPageSpinner />
  // Vừa đăng nhập xong thì về trang đã mở trước đó (ProtectedRoute lưu ở state.from), không thì về trang chủ
  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }
  return <>{children}</>
}
