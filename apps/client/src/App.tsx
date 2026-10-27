import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/authStore'

import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestRoute } from './components/GuestRoute'
import { AppLayout } from './components/layout/AppLayout'

import RegisterPage from './pages/auth/register'
import VerifyEmailPage from './pages/auth/verify-email'

import HomePage from './pages/home'
import AccountPage from './pages/account'
import NotFoundPage from './pages/not-found'

function App() {
  const initAuth = useAuthStore((s) => s.initAuth)
  const initCalled = useRef(false)

  useEffect(() => {
    if (initCalled.current) return
    initCalled.current = true
    initAuth()
  }, [initAuth])

  return (
    <>
      <Toaster richColors position='top-right' />
      <Routes>
        <Route
          path='/'
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          }
        />

        {/* US-01 — chỉ dành cho khách chưa đăng nhập */}
        <Route
          path='/register'
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path='/verify-email'
          element={
            <GuestRoute>
              <VerifyEmailPage />
            </GuestRoute>
          }
        />

        <Route
          path='/account'
          element={
            <ProtectedRoute>
              <AppLayout>
                <AccountPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
