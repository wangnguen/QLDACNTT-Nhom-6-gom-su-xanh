import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { FullPageSpinner } from './Spinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) return <FullPageSpinner />
  // Lưu trang đang mở để đăng nhập xong quay lại đúng chỗ
  if (!isAuthenticated) return <Navigate to='/login' replace state={{ from: location.pathname }} />
  return <>{children}</>
}
