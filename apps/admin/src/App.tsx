import { useEffect, useRef } from 'react'
import { Outlet, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/authStore'

import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestRoute } from './components/GuestRoute'
import { AdminLayout } from './components/layout/AdminLayout'

import LoginPage from './pages/auth/login'
import DashboardPage from './pages/dashboard'
import CategoriesPage from './pages/categories'
import ProductsPage from './pages/products'
import ProductFormPage from './pages/products/form'
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

        {/* Các trang quản trị dùng chung khung AdminLayout, cần đăng nhập */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            </ProtectedRoute>
          }
        >
          <Route path='/' element={<DashboardPage />} />

          {/* US-07: Quản lý danh mục và sản phẩm */}
          <Route path='/categories' element={<CategoriesPage />} />
          <Route path='/products' element={<ProductsPage />} />
          <Route path='/products/new' element={<ProductFormPage />} />
          <Route path='/products/:id/edit' element={<ProductFormPage />} />
        </Route>

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
