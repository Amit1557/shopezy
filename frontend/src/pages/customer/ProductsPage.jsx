import { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { Filter, X, ShoppingBag, ArrowUpDown, SlidersHorizontal, Search } from 'lucide-react'
import { productsPublicAPI, categoriesAPI } from '../../services/api'
import ProductCard from '../../components/customer/ProductCard'
import MeeshoFilterSidebar from '../../components/customer/MeeshoFilterSidebar'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Sort by : Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function ProductsPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const sort = searchParams.get('sort') || 'popular'
  const search = searchParams.get('search') || ''
  const subcategory = searchParams.get('subcategory') || ''
  const shape = searchParams.get('shape') || ''
  const strap = searchParams.get('strap') || ''
  const fabric = searchParams.get('fabric') || ''
  const categoryId = searchParams.get('category_id') || ''
  const categorySlugParam = searchParams.get('category') || ''
  const activeCategorySlug = slug || categorySlugParam

  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const minRating = searchParams.get('min_rating') || ''
  const minDiscount = searchParams.get('min_discount') || ''
  const size = searchParams.get('size') || ''
  const color = searchParams.get('color') || ''
  const gender = searchParams.get('gender') || ''
  const featured = searchParams.get('featured') || ''

  useEffect(() => {
    categoriesAPI.getAll(false).then(res => setCategories(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let isCurrent = true
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = { page, sort, limit: 16 }

        // Combine search terms smoothly without page refresh
        const searchTerms = [search, subcategory, shape, strap, fabric].filter(Boolean).join(' ')
        if (searchTerms) params.search = searchTerms

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

        const res = await productsPublicAPI.getAll(params)
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

    fetchProducts()
    return () => {
      isCurrent = false
    }
  }, [searchParams, slug])

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

  // Find active category name
  const currentCategory = categories.find(c => String(c.id) === String(categoryId) || c.slug === activeCategorySlug)
  const categoryTitle = currentCategory ? currentCategory.name : (search ? `Search results for "${search}"` : 'All Products')

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Top Bar / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight capitalize">
            {categoryTitle}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {total} product{total !== 1 ? 's' : ''} with Free Cash on Delivery (COD)
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
              className="text-xs py-2 pl-3 pr-8 rounded-xl border border-gray-300 bg-white font-bold text-gray-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 cursor-pointer shadow-sm"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout with Meesho Side Filter */}
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
                  <span>{categoryTitle}</span>
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

              {shape && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold capitalize">
                  <span>Shape: {shape}</span>
                  <button onClick={() => updateParam('shape', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                </span>
              )}

              {strap && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold capitalize">
                  <span>Strap: {strap}</span>
                  <button onClick={() => updateParam('strap', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
                </span>
              )}

              {fabric && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold capitalize">
                  <span>Fabric: {fabric}</span>
                  <button onClick={() => updateParam('fabric', '')} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
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

          {/* Product Grid - Smooth Meesho Experience (No Screen Flashing) */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-gray-100 p-2.5 shadow-sm animate-pulse space-y-2.5">
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
              message="Try clearing some filters or search for another item."
              actionText="Clear All Filters"
              onAction={clearFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 animate-fade-in">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination page={page} pages={pages} onPageChange={p => updateParam('page', p)} />
        </div>
      </div>

      {/* Mobile Filters Sliding Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />

          {/* Drawer */}
          <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-2xl flex flex-col z-50 animate-slide-left overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-purple-900 text-white">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-yellow-300" />
                <span className="font-extrabold text-sm">Filters ({total} Products)</span>
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
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
          </div>
        </div>
      )}
    </div>
  )
}
