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
import WorkshopsPage from './pages/workshops'
import WorkshopFormPage from './pages/workshops/form'
import WorkshopRegistrationsPage from './pages/workshop-registrations'
import OrdersPage from './pages/orders'
import OrderDetailPage from './pages/orders/detail'
import ShippingPage from './pages/shipping'
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

          {/* US-11: Quản lý lớp workshop */}
          <Route path='/workshops' element={<WorkshopsPage />} />
          <Route path='/workshops/new' element={<WorkshopFormPage />} />
          <Route path='/workshops/:id/edit' element={<WorkshopFormPage />} />

          {/* US-13: Quản lý đăng ký workshop */}
          <Route path='/workshop-registrations' element={<WorkshopRegistrationsPage />} />

          {/* US-18: Quản lý đơn hàng */}
          <Route path='/orders' element={<OrdersPage />} />
          <Route path='/orders/:id' element={<OrderDetailPage />} />

          {/* US-19: Quản lý vận chuyển */}
          <Route path='/shipping' element={<ShippingPage />} />
        </Route>

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
