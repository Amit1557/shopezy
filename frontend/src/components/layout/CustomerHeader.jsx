import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Search, Menu, X, Package, ChevronDown, User, LogOut, ChevronRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCustomer } from '../../context/CustomerContext'
import { MEESHO_CATEGORIES } from '../../utils/meeshoCategories'

export default function CustomerHeader() {
  const { totalItems } = useCart()
  const { customer, isCustomerLoggedIn, openAuthModal, logoutCustomer } = useCustomer()
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMobileCategory, setExpandedMobileCategory] = useState(null)
  const [activeMegaCategory, setActiveMegaCategory] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const userMenuRef = useRef(null)
  const megaMenuTimeoutRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Sync search input with URL search param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSearch(params.get('search') || '')
  }, [location.search])

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
    const query = search.trim()
    if (location.pathname === '/products') {
      const p = new URLSearchParams(location.search)
      if (query) p.set('search', query)
      else p.delete('search')
      p.delete('page')
      navigate(`/products?${p.toString()}`, { replace: true })
    } else {
      if (query) {
        navigate(`/products?search=${encodeURIComponent(query)}`)
      } else {
        navigate('/products')
      }
    }
  }

  const handleMouseEnterCategory = (cat) => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current)
    setActiveMegaCategory(cat)
  }

  const handleMouseLeaveCategory = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaCategory(null)
    }, 180)
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
      {/* Top Banner (Free COD) */}
      <div className="bg-gradient-to-r from-purple-800 to-brand-600 text-white text-[11px] sm:text-xs text-center py-1.5 px-3 font-semibold tracking-wide flex items-center justify-center gap-1.5 truncate">
        <span>🎉 Free Cash on Delivery on all orders! 7-day easy exchange support.</span>
      </div>
      
      {/* Main header row */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Trigger + Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open Menu"
            className="md:hidden p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-purple-800 to-pink-600 rounded-xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-purple-200 flex-shrink-0">
              S
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent tracking-tight">
                ShopEzy
              </span>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider -mt-1 hidden sm:block">
                Cash on Delivery
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Search Bar (Meesho Style - Hidden on Mobile) */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl lg:max-w-2xl mx-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Try Saree, Kurti, Sports Shoes, T-Shirts, Smartwatches..."
              className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-gray-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-0 top-0 h-full px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-r-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link
            to="/my-orders"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-purple-700 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Package className="w-4 h-4 text-purple-700" />
            <span className="hidden lg:block">My Orders</span>
          </Link>

          <Link
            to="/track-order"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-purple-700 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <span className="hidden lg:block">Track Order</span>
          </Link>
          
          <Link
            to="/cart"
            aria-label="Shopping Cart"
            className="relative flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-purple-700 p-2 sm:px-2.5 sm:py-2 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-gray-800" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black animate-scale-in">
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
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center font-black text-[11px] flex-shrink-0">
                  {customer?.name ? customer.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[70px] truncate hidden sm:inline">{customer?.name || 'Account'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-600 hidden sm:inline" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-scale-in text-xs">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="font-black text-gray-900 truncate">{customer?.name}</p>
                    <p className="text-gray-500 text-[11px] font-mono">{customer?.mobile}</p>
                  </div>
                  <Link
                    to="/my-orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-purple-50 text-gray-700 hover:text-purple-700 font-semibold transition-colors"
                  >
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>My Orders & Returns</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      logoutCustomer()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 font-semibold transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-1 text-xs font-black text-white bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-sm shadow-purple-200 transition-all cursor-pointer flex-shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login / Sign Up</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Mobile Search Bar (Full width on Mobile) */}
      <div className="md:hidden px-3 pb-2.5">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative flex items-center">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search saree, kurti, shoes, toys..."
              className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-gray-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none text-xs bg-gray-50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Row 3: Mobile Category Horizontal Scroll Ribbon */}
      <div className="md:hidden border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-[11px] font-bold text-gray-700 whitespace-nowrap">
          {MEESHO_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={cat.slug === 'popular' ? '/products' : `/category/${cat.slug}`}
              className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:border-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-colors flex-shrink-0"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Meesho Category Navigation Bar (Desktop) */}
      <div
        className="border-t border-gray-200 hidden md:block bg-white relative"
        onMouseLeave={handleMouseLeaveCategory}
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {MEESHO_CATEGORIES.map((cat) => {
              const isActive = activeMegaCategory?.slug === cat.slug
              return (
                <div
                  key={cat.slug}
                  onMouseEnter={() => handleMouseEnterCategory(cat)}
                  className="relative group py-2.5 px-2 hover:text-pink-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Link
                    to={cat.slug === 'popular' ? '/products' : `/category/${cat.slug}`}
                    className={`flex items-center gap-1 ${
                      isActive ? 'text-pink-600 font-bold border-b-2 border-pink-600' : ''
                    }`}
                  >
                    <span>{cat.name}</span>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mega Dropdown Menu - EXACT Meesho Style */}
        {activeMegaCategory && activeMegaCategory.subsections && activeMegaCategory.subsections.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full bg-white shadow-xl border-t border-gray-200 border-b border-gray-300 py-6 z-50 animate-fade-in"
            onMouseEnter={() => {
              if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current)
            }}
            onMouseLeave={handleMouseLeaveCategory}
          >
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-flow-col auto-cols-fr gap-8">
                {activeMegaCategory.subsections.map((sub, idx) => (
                  <div key={idx} className="space-y-2 border-r last:border-none border-gray-100 pr-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-pink-600 pb-1 border-b border-pink-100">
                      {sub.title}
                    </h4>
                    <ul className="space-y-1.5 pt-1">
                      {sub.items.map((item, itemIdx) => (
                        <li key={itemIdx}>
                          <Link
                            to={`/products?category=${activeMegaCategory.slug}&search=${encodeURIComponent(item)}`}
                            onClick={() => setActiveMegaCategory(null)}
                            className="text-xs text-gray-600 hover:text-pink-600 hover:underline block py-0.5 transition-colors"
                          >
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b bg-purple-50">
              <span className="font-black text-purple-900 text-sm flex items-center gap-1.5">
                Categories & Menu
              </span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 divide-y divide-gray-100">
              <Link
                to="/products"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-bold text-purple-700 bg-purple-50 rounded-lg mb-2"
              >
                🔥 All Products (Full Catalog)
              </Link>

              {/* Meesho Categories Accordion */}
              {MEESHO_CATEGORIES.map(cat => {
                const isExpanded = expandedMobileCategory === cat.slug
                return (
                  <div key={cat.slug} className="pt-1.5 pb-1">
                    <div className="flex items-center justify-between">
                      <Link
                        to={cat.slug === 'popular' ? '/products' : `/category/${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="text-xs font-bold text-gray-800 hover:text-pink-600 py-1"
                      >
                        {cat.name}
                      </Link>
                      {cat.subsections && cat.subsections.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.slug)}
                          className="p-1 text-gray-400 hover:text-purple-600"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {isExpanded && cat.subsections && (
                      <div className="pl-3 pt-2 space-y-3 bg-gray-50 rounded-lg p-2.5 mt-1">
                        {cat.subsections.map((sub, sIdx) => (
                          <div key={sIdx} className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-pink-600">{sub.title}</p>
                            <div className="flex flex-wrap gap-1">
                              {sub.items.map((it, iIdx) => (
                                <Link
                                  key={iIdx}
                                  to={`/products?category=${cat.slug}&search=${encodeURIComponent(it)}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="text-[11px] text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded hover:border-pink-500"
                                >
                                  {it}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Customer Account area on Mobile */}
              <div className="pt-4 space-y-2">
                {isCustomerLoggedIn ? (
                  <>
                    <div className="px-3 py-2 bg-purple-50 rounded-lg">
                      <p className="text-[10px] font-black text-purple-900 uppercase">Signed in as</p>
                      <p className="text-xs font-bold text-gray-800">{customer?.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{customer?.mobile}</p>
                    </div>
                    <Link
                      to="/my-orders"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 rounded-lg"
                    >
                      <Package className="w-4 h-4" /> My Orders & Return Requests
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        logoutCustomer()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg text-left font-bold"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      openAuthModal()
                    }}
                    className="w-full btn-primary text-xs py-2.5 font-bold flex items-center justify-center gap-1.5"
                  >
                    <User className="w-4 h-4" /> Sign In / Create Account
                  </button>
                )}
                
                <Link
                  to="/track-order"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Package className="w-4 h-4" /> Track Order Status
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <ShoppingCart className="w-4 h-4" /> Cart ({totalItems})
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
