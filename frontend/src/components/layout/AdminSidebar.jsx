import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3,
  Settings, LogOut, X, Tag, Store
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function AdminSidebar({ isOpen, onClose }) {
  const { logout, admin } = useAuth()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-brand">S</div>
              <div>
                <div className="font-bold text-gray-800 leading-tight">ShopEzy</div>
                <div className="text-xs text-gray-400">Seller Panel</div>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border border-brand-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
              <Store className="w-4 h-4 text-brand-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">{admin?.name || 'Admin'}</div>
              <div className="text-xs text-gray-400 truncate">{admin?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
