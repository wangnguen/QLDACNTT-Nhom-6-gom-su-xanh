import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { FullPageSpinner } from './Spinner'

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()

  if (!initialized) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to='/' replace />
  return <>{children}</>
}
