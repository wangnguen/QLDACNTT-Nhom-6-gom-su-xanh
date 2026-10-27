import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/authStore'

import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestRoute } from './components/GuestRoute'
import { AppLayout } from './components/layout/AppLayout'

import LoginPage from './pages/auth/login'
import RegisterPage from './pages/auth/register'
import VerifyEmailPage from './pages/auth/verify-email'
import ForgotPasswordPage from './pages/auth/forgot-password'
import ResetPasswordPage from './pages/auth/reset-password'

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

        {/* US-01, US-02, US-03 — chỉ dành cho khách chưa đăng nhập */}
        <Route
          path='/login'
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
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
          path='/forgot-password'
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route path='/reset-password' element={<ResetPasswordPage />} />

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
