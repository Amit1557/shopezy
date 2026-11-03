import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3,
  Settings, LogOut, X, Tag, Store, ShieldCheck
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

export default function AdminSidebar({ isOpen, onClose, onOpenProfile }) {
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

          {/* Quick Settings Action */}
          <button
            onClick={() => {
              if (onClose) onClose()
              if (onOpenProfile) onOpenProfile()
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150 text-left"
          >
            <Settings className="w-5 h-5 flex-shrink-0 text-purple-600" />
            <span>Admin Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div
            onClick={() => {
              if (onClose) onClose()
              if (onOpenProfile) onOpenProfile()
            }}
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all"
            title="Click to edit profile & credentials"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-gray-800 truncate">{admin?.name || 'Admin'}</div>
              <div className="text-xs text-gray-400 truncate">{admin?.email}</div>
            </div>
            <Settings className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
