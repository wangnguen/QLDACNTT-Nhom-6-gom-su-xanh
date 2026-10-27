import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/authStore'

import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestRoute } from './components/GuestRoute'
import { AdminLayout } from './components/layout/AdminLayout'

import LoginPage from './pages/auth/login'
import DashboardPage from './pages/dashboard'
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
          path='/login'
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        <Route
          path='/'
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
