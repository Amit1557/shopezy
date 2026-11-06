import { Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { CustomerProvider } from './context/CustomerContext'
import CustomerLayout from './components/layout/CustomerLayout'
import AdminLayout from './components/layout/AdminLayout'
import { lazy, Suspense } from 'react'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Customer pages
const HomePage = lazy(() => import('./pages/customer/HomePage'))
const ProductsPage = lazy(() => import('./pages/customer/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/customer/CartPage'))
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'))
const TrackOrderPage = lazy(() => import('./pages/customer/TrackOrderPage'))
const MyOrdersPage = lazy(() => import('./pages/customer/MyOrdersPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'))
import ProductsAdminPage from './pages/admin/ProductsAdminPage'
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'))
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage'))
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'))

const SuspenseFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <CustomerProvider>
        <CartProvider>
          <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Customer storefront routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/category/:slug" element={<ProductsPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/404" element={<NotFoundPage />} />
            </Route>

            {/* Admin backoffice routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="products" element={<ProductsAdminPage />} />
              <Route path="products/new" element={<ProductFormPage />} />
              <Route path="products/:id/edit" element={<ProductFormPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </CartProvider>
    </CustomerProvider>
  </AuthProvider>
  )
}

