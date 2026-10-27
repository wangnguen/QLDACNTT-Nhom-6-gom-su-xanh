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

import { AccountLayout } from './pages/account/components'
import AccountPage from './pages/account'
import ChangeEmailPage from './pages/account/change-email'
import ChangePasswordPage from './pages/account/change-password'

import HomePage from './pages/home'
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

        {/* US-04, US-05 — tài khoản của tôi (cần đăng nhập) */}
        <Route
          path='/account'
          element={
            <ProtectedRoute>
              <AppLayout>
                <AccountLayout />
              </AppLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountPage />} />
          <Route path='email' element={<ChangeEmailPage />} />
          <Route path='password' element={<ChangePasswordPage />} />
        </Route>

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
