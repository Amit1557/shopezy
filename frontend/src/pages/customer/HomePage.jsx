import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, Truck, Shield, RefreshCw, CreditCard, ArrowRight,
  Flame, Star, Zap, Check, SlidersHorizontal, X, ShoppingBag
} from 'lucide-react'
import { categoriesAPI, productsPublicAPI } from '../../services/api'
import ProductCard from '../../components/customer/ProductCard'
import CategoryCard from '../../components/customer/CategoryCard'
import MeeshoFilterSidebar from '../../components/customer/MeeshoFilterSidebar'
import EmptyState from '../../components/ui/EmptyState'

const BANNERS = [
  {
    title: "Lowest Prices, Best Quality",
    subtitle: "Direct from verified Indian manufacturers with 100% Free Cash on Delivery",
    cta: "Shop Now",
    link: "/#products-feed",
    badge: "✨ Festive Mega Sale",
    discount: "UP TO 70% OFF",
    bg: "from-[#2A082C] via-[#481249] to-[#691B64]",
    accentColor: "text-amber-300",
    btnColor: "bg-amber-400 hover:bg-amber-300 text-gray-950",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80",
    highlights: ["Free Doorstep Delivery", "7-Day Easy Exchange", "Cash on Delivery"]
  },
  {
    title: "Trending Fashion & Daily Essentials",
    subtitle: "Affordable sarees, kurtis, jeans & footwear at true factory prices",
    cta: "Explore Trending",
    link: "/#products-feed",
    badge: "🔥 Top Bestsellers",
    discount: "STARTING @ ₹149",
    bg: "from-[#0D1B30] via-[#142A4A] to-[#1D3E6B]",
    accentColor: "text-cyan-300",
    btnColor: "bg-cyan-400 hover:bg-cyan-300 text-gray-950",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=80",
    highlights: ["Handpicked Quality", "Safe & Secure COD", "Pan-India Delivery"]
  },
  {
    title: "Fresh New Arrivals This Week",
    subtitle: "New stylish apparel, footwear, and smart accessories added daily",
    cta: "View New Styles",
    link: "/#products-feed",
    badge: "✨ Just Launched",
    discount: "SPECIAL LAUNCH PRICES",
    bg: "from-[#200F1A] via-[#3B192E] to-[#572442]",
    accentColor: "text-rose-300",
    btnColor: "bg-rose-400 hover:bg-rose-300 text-gray-950",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
    highlights: ["Trending Styles", "Zero Hidden Charges", "Pay on Delivery"]
  }
]

const FEATURES = [
  { icon: Truck, title: 'Free Delivery', desc: 'On all orders across India' },
  { icon: CreditCard, title: 'Cash on Delivery', desc: 'Pay when your parcel arrives' },
  { icon: Shield, title: 'Verified Quality', desc: 'Handpicked products guaranteed' },
  { icon: RefreshCw, title: 'Easy Returns', desc: 'Hassle-free replacement support' },
]

const SORT_OPTIONS = [
  { value: 'popular', label: 'Sort by : Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeBanner, setActiveBanner] = useState(0)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const loadMoreRef = useRef(null)

  // Query parameters from URL
  const sort = searchParams.get('sort') || 'popular'
  const search = searchParams.get('search') || ''
  const subcategory = searchParams.get('subcategory') || ''
  const shape = searchParams.get('shape') || ''
  const strap = searchParams.get('strap') || ''
  const fabric = searchParams.get('fabric') || ''
  const categoryId = searchParams.get('category_id') || ''
  const activeCategorySlug = searchParams.get('category') || ''

  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const minRating = searchParams.get('min_rating') || ''
  const minDiscount = searchParams.get('min_discount') || ''
  const size = searchParams.get('size') || ''
  const color = searchParams.get('color') || ''
  const gender = searchParams.get('gender') || ''
  const featured = searchParams.get('featured') || ''

  // Load categories
  useEffect(() => {
    categoriesAPI.getAll(false)
      .then(res => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  // Auto-slide hero banner
  useEffect(() => {
    const interval = setInterval(() => setActiveBanner(b => (b + 1) % BANNERS.length), 5000)
    return () => clearInterval(interval)
  }, [])

  const buildParams = useCallback((pageToFetch) => {
    const params = { page: pageToFetch, sort, limit: 16 }
    const searchTerms = [search, shape, strap, fabric].filter(Boolean).join(' ')
    if (searchTerms) params.search = searchTerms
    if (subcategory) params.subcategory = subcategory

    if (categoryId) params.category_id = categoryId
    if (activeCategorySlug && activeCategorySlug !== 'popular') params.category_slug = activeCategorySlug
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice
    if (minRating) params.min_rating = minRating
    if (minDiscount) params.min_discount = minDiscount
    if (size) params.size = size
    if (color) params.color = color
    if (gender) params.gender = gender
    if (featured) params.featured = featured
    return params
  }, [
    sort, search, subcategory, shape, strap, fabric, categoryId, activeCategorySlug,
    minPrice, maxPrice, minRating, minDiscount, size, color, gender, featured
  ])

  // Initial fetch on filters change
  useEffect(() => {
    let isCurrent = true
    setCurrentPage(1)
    setLoading(true)

    const fetchInitial = async () => {
      try {
        const res = await productsPublicAPI.getAll(buildParams(1))
        if (isCurrent) {
          setProducts(res.data.products || [])
          setTotal(res.data.total || 0)
          setPages(res.data.pages || 1)
        }
      } catch {
        if (isCurrent) setProducts([])
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    fetchInitial()
    return () => { isCurrent = false }
  }, [buildParams])

  // Load more items for infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || currentPage >= pages) return
    const nextPage = currentPage + 1
    setLoadingMore(true)
    try {
      const res = await productsPublicAPI.getAll(buildParams(nextPage))
      const incoming = res.data.products || []
      setProducts(prev => {
        const seen = new Set(prev.map(p => p.id))
        const unique = incoming.filter(p => !seen.has(p.id))
        return [...prev, ...unique]
      })
      setCurrentPage(nextPage)
      setPages(res.data.pages || 1)
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error('Error loading more products:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loading, loadingMore, currentPage, pages, buildParams])

  // Auto-trigger load more as user scrolls down towards the bottom
  useEffect(() => {
    if (loading || loadingMore || currentPage >= pages) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    )

    const el = loadMoreRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [loading, loadingMore, currentPage, pages, handleLoadMore])

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p, { replace: true })
  }

  const clearFilters = () => {
    setSearchParams({}, { replace: true })
  }

  const activeFiltersCount = [
    activeCategorySlug,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    size,
    color,
    gender,
    featured,
    search,
    subcategory,
    shape,
    strap,
    fabric,
  ].filter(Boolean).length

  // Current active category title
  const currentCategory = categories.find(c => String(c.id) === String(categoryId) || c.slug === activeCategorySlug)
  const headingTitle = currentCategory ? currentCategory.name : (search ? `Search results for "${search}"` : 'Products For You')

  return (
    <div className="w-full">
      {/* 1. Thin & Slim Meesho-Style Promo Ribbon (Ultra Compact) */}
      <section className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-1">
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-gray-100">
          <div className={`bg-gradient-to-r ${BANNERS[activeBanner].bg} text-white transition-all duration-500 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3`}>
            
            {/* Left Content */}
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="hidden sm:flex w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md items-center justify-center shrink-0 border border-white/15">
                <Flame className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 backdrop-blur-md rounded-md text-[10px] font-black tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className={BANNERS[activeBanner].accentColor}>{BANNERS[activeBanner].badge}</span>
                  </span>
                  <h1 className="text-xs sm:text-sm md:text-base font-black truncate drop-shadow-xs">
                    {BANNERS[activeBanner].title}
                  </h1>
                </div>
                <p className="text-white/80 text-[10px] sm:text-[11px] truncate font-medium mt-0.5">
                  {BANNERS[activeBanner].subtitle} • 100% Free Doorstep COD
                </p>
              </div>
            </div>

            {/* Right Action */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <div className="hidden md:block bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider text-amber-300 uppercase">
                {BANNERS[activeBanner].discount}
              </div>
              <a
                href="#products-feed"
                className={`inline-flex items-center gap-1 ${BANNERS[activeBanner].btnColor} font-black px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 text-xs`}
              >
                {BANNERS[activeBanner].cta} <ArrowRight className="w-3 h-3" />
              </a>
            </div>

          </div>

          {/* Minimal banner dots */}
          <div className="absolute bottom-1 right-4 flex gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBanner(i)}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${i === activeBanner ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Trust Badges Bar (Full Width) */}
      <div className="bg-white border-b border-gray-100 shadow-sm mt-2 sm:mt-3">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-2 sm:gap-3 p-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{title}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Category Circles Ribbon (Full Width) */}
      {categories.length > 0 && (
        <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <section className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-1.5">
                  <span>🛍️ Explore Top Categories</span>
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Click any category to filter items below</p>
              </div>
              <button
                onClick={() => updateParam('category', '')}
                className="text-xs text-purple-700 hover:text-purple-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((cat, i) => (
                <div
                  key={cat.id}
                  onClick={() => updateParam('category', cat.slug)}
                  className="cursor-pointer flex-shrink-0"
                >
                  <CategoryCard category={cat} index={i} />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 4. MAIN FEED: EXACT MEESHO LAYOUT (Photo 2) - Filter on Left, Products on Right */}
      <div id="products-feed" className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Top Header of Main Feed */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight capitalize">
              {headingTitle}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {total} product{total !== 1 ? 's' : ''} with 100% Free Cash on Delivery (COD)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className={`lg:hidden btn-secondary text-xs flex items-center gap-1.5 py-2 px-3.5 font-bold ${
                activeFiltersCount > 0 ? 'border-purple-600 text-purple-700 bg-purple-50' : ''
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Meesho Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => updateParam('sort', e.target.value)}
                className="text-xs py-2 pl-3 pr-8 rounded-xl border border-gray-300 bg-white font-bold text-gray-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 cursor-pointer shadow-xs"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout: Left Filter Sidebar + Right Product Grid (Meesho Style) */}
        <div className="flex gap-6 items-start">
          
          {/* Desktop Sticky Meesho Sidebar */}
          <div className="w-64 flex-shrink-0 hidden lg:block sticky top-24 self-start">
            <MeeshoFilterSidebar
              categories={categories}
              activeCategorySlug={activeCategorySlug}
              totalProducts={total}
              searchParams={searchParams}
              updateParam={updateParam}
              clearAllFilters={clearFilters}
            />
          </div>

          {/* Right Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2.5 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mr-1">Active:</span>

                {activeCategorySlug && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                    <span>{headingTitle}</span>
                    <button onClick={() => updateParam('category', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {subcategory && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                    <span>{subcategory}</span>
                    <button onClick={() => updateParam('subcategory', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {gender && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold capitalize">
                    <span>Gender: {gender}</span>
                    <button onClick={() => updateParam('gender', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                    <span>₹{minPrice || 0} - ₹{maxPrice || '∞'}</span>
                    <button onClick={() => { updateParam('min_price', ''); updateParam('max_price', '') }} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {size && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                    <span>Size: {size}</span>
                    <button onClick={() => updateParam('size', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {color && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold capitalize">
                    <span>Color: {color}</span>
                    <button onClick={() => updateParam('color', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {minRating && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                    <span>{minRating}★ & Above</span>
                    <button onClick={() => updateParam('min_rating', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {minDiscount && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                    <span>{minDiscount}%+ Discount</span>
                    <button onClick={() => updateParam('min_discount', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {search && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-200 text-gray-800 px-2.5 py-1 rounded-full font-bold">
                    <span>"{search}"</span>
                    <button onClick={() => updateParam('search', '')} className="hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}

                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-red-600 hover:underline ml-auto pl-2 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Product Grid Area */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-gray-100 p-2.5 shadow-xs animate-pulse space-y-2.5">
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl w-full" />
                    <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No products match your filters"
                message="Try clearing some filters or browsing another category."
                actionText="Clear All Filters"
                onAction={clearFilters}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 animate-fade-in">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Meesho-Style Infinite Scroll Indicator & Sentinel */}
            {!loading && products.length > 0 && (
              <div className="mt-8 mb-6">
                {currentPage < pages && (
                  <div ref={loadMoreRef} className="flex flex-col items-center justify-center py-6 gap-3">
                    {loadingMore ? (
                      <div className="flex items-center gap-2.5 bg-purple-50 text-purple-900 border border-purple-200 px-5 py-2.5 rounded-full shadow-xs animate-pulse">
                        <div className="w-4 h-4 rounded-full border-2 border-purple-300 border-t-purple-700 animate-spin" />
                        <span className="text-xs font-black">Loading more products...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        className="group bg-white hover:bg-purple-50 text-purple-800 border-2 border-purple-200 hover:border-purple-400 font-black text-xs py-2.5 px-6 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        <span>Scroll down or tap to load more</span>
                        <span className="bg-purple-100 group-hover:bg-purple-200 text-purple-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {products.length} of {total}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {currentPage >= pages && total > 0 && (
                  <div className="py-8 flex flex-col items-center justify-center text-center gap-1.5 border-t border-gray-100 mt-6">
                    <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-600 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200/80">
                      <span>🎉 You've reached the end! Viewed all {total} products.</span>
                    </div>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-xs font-extrabold text-purple-700 hover:text-purple-950 hover:underline cursor-pointer mt-1"
                    >
                      Back to Top ↑
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Filters Sliding Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowMobileFilters(false)} />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full overflow-y-auto shadow-2xl p-4 flex flex-col z-10 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <h3 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-purple-700" />
                <span>Filters</span>
              </h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <MeeshoFilterSidebar
                categories={categories}
                activeCategorySlug={activeCategorySlug}
                totalProducts={total}
                searchParams={searchParams}
                updateParam={updateParam}
                clearAllFilters={clearFilters}
                onCloseMobile={() => setShowMobileFilters(false)}
              />
            </div>

            <div className="pt-3 border-t mt-auto">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="btn-primary w-full py-2.5 text-xs font-bold"
              >
                Apply Filters ({total} Products)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
