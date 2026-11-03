import { Menu, Settings, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminHeader({ onMenuClick, onOpenProfile }) {
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
        <button
          onClick={onOpenProfile}
          title="Click to change Admin Name, Email ID & Password"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all text-left group"
        >
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-gray-800 group-hover:text-purple-700 transition-colors flex items-center gap-1 justify-end">
              <span>{admin?.name || 'Admin'}</span>
              <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 group-hover:rotate-45 transition-all" />
            </div>
            <div className="text-[11px] text-gray-400 group-hover:text-purple-500">{admin?.email || 'Store Owner'}</div>
          </div>
          <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-brand-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </button>
      </div>
    </header>
  )
}
