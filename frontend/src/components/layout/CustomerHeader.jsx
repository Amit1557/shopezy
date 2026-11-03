import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, Menu, X, Package, Heart, ChevronDown, User, LogOut } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCustomer } from '../../context/CustomerContext'

const NAV_LINKS = [
  { label: "Men's Fashion", slug: 'mens-fashion' },
  { label: "Women's Fashion", slug: 'womens-fashion' },
  { label: "Kids'", slug: 'kids-fashion' },
  { label: 'Footwear', slug: 'footwear' },
  { label: 'Accessories', slug: 'accessories' },
  { label: 'Home & Kitchen', slug: 'home-kitchen' },
  { label: 'Beauty', slug: 'beauty-lifestyle' },
]

export default function CustomerHeader() {
  const { totalItems } = useCart()
  const { customer, isCustomerLoggedIn, openAuthModal, logoutCustomer } = useCustomer()
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-gradient-brand text-white text-xs text-center py-1.5 px-4">
        🎉 Free Cash on Delivery on all orders! Shop with confidence.
      </div>
      
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-brand">
            S
          </div>
          <div>
            <span className="text-xl font-bold text-gradient hidden sm:block">ShopEzy</span>
            <div className="text-[10px] text-gray-400 -mt-1 hidden sm:block">Cash on Delivery</div>
          </div>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for clothes, shoes, accessories..."
              className="w-full pl-4 pr-12 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
            />
            <button type="submit" className="absolute right-0 top-0 h-full px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-r-xl transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          <Link to="/my-orders" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-brand-600 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors">
            <Package className="w-4 h-4 text-purple-600" />
            <span className="hidden lg:block">My Orders</span>
          </Link>

          <Link to="/track-order" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-brand-600 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors">
            <span className="hidden lg:block">Track Order</span>
          </Link>
          
          <Link to="/cart" className="relative flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-brand-600 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-gray-800" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </div>
            <span className="hidden md:block">Cart</span>
          </Link>

          {/* Customer Account Button */}
          {isCustomerLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 text-xs font-black transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:inline max-w-[90px] truncate">{customer?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{customer?.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{customer?.mobile}</p>
                  </div>
                  <Link
                    to="/my-orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-brand-600 font-medium"
                  >
                    <Package className="w-4 h-4" /> My Orders & Returns
                  </Link>
                  <Link
                    to="/track-order"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-brand-600 font-medium"
                  >
                    <Search className="w-4 h-4" /> Track Single Order
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setUserMenuOpen(false); logoutCustomer(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium border-t border-gray-50 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="btn-primary text-xs py-2 px-3.5 font-bold shadow-sm inline-flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login / Sign Up</span>
            </button>
          )}

          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category nav - desktop */}
      <div className="border-t border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
            <Link to="/products" className="flex-shrink-0 px-3 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors font-medium">
              All Products
            </Link>
            {NAV_LINKS.map(link => (
              <Link
                key={link.slug}
                to={`/category/${link.slug}`}
                className="flex-shrink-0 px-3 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-gray-800">Menu</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link to="/products" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg">All Products</Link>
              {NAV_LINKS.map(link => (
                <Link key={link.slug} to={`/category/${link.slug}`} onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                {isCustomerLoggedIn ? (
                  <>
                    <div className="px-3 py-2 bg-purple-50 rounded-lg">
                      <p className="text-xs font-black text-purple-900">Signed in as</p>
                      <p className="text-xs font-bold text-gray-800">{customer?.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{customer?.mobile}</p>
                    </div>
                    <Link to="/my-orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-brand-600 hover:bg-brand-50 rounded-lg">
                      <Package className="w-4 h-4" /> My Orders & Returns
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); logoutCustomer(); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); openAuthModal(); }}
                    className="w-full btn-primary text-xs py-2.5 font-bold flex items-center justify-center gap-1.5"
                  >
                    <User className="w-4 h-4" /> Sign In / Create Account
                  </button>
                )}
                <Link to="/my-orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Package className="w-4 h-4" /> My Orders
                </Link>
                <Link to="/track-order" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Package className="w-4 h-4" /> Track Order
                </Link>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-4 h-4" /> Cart {totalItems > 0 && `(${totalItems})`}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
