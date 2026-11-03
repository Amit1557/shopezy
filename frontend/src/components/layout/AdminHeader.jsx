import { Menu, Bell, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminHeader({ onMenuClick }) {
  const { admin } = useAuth()
  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-800 hidden sm:block">ShopEzy Seller Panel</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-700">{admin?.name || 'Admin'}</div>
          <div className="text-xs text-gray-400">Store Owner</div>
        </div>
        <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
          <span className="text-brand-700 font-bold text-sm">{admin?.name?.[0] || 'A'}</span>
        </div>
      </div>
    </header>
  )
}
