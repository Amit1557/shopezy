import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ShoppingBag } from 'lucide-react'
import { productsPublicAPI, categoriesAPI } from '../../services/api'
import ProductCard from '../../components/customer/ProductCard'
import Pagination from '../../components/ui/Pagination'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const sort = searchParams.get('sort') || 'newest'
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('category_id') || ''
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const featured = searchParams.get('featured') || ''

  const [priceFrom, setPriceFrom] = useState(minPrice)
  const [priceTo, setPriceTo] = useState(maxPrice)

  useEffect(() => {
    categoriesAPI.getAll().then(res => setCategories(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = { page, sort, limit: 12 }
        if (search) params.search = search
        if (categoryId) params.category_id = categoryId
        if (minPrice) params.min_price = minPrice
        if (maxPrice) params.max_price = maxPrice
        if (featured) params.featured = featured
        const res = await productsPublicAPI.getAll(params)
        setProducts(res.data.products || [])
        setTotal(res.data.total || 0)
        setPages(res.data.pages || 1)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [searchParams])

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const applyPriceFilter = () => {
    const p = new URLSearchParams(searchParams)
    if (priceFrom) p.set('min_price', priceFrom); else p.delete('min_price')
    if (priceTo) p.set('max_price', priceTo); else p.delete('max_price')
    p.delete('page')
    setSearchParams(p)
    setShowFilters(false)
  }

  const clearFilters = () => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    setSearchParams(p)
    setPriceFrom('')
    setPriceTo('')
  }

  const hasFilters = categoryId || minPrice || maxPrice || featured

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `Results for "${search}"` : 'All Products'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{total} products available with Cash on Delivery</p>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
          <div className="relative">
            <select
              value={sort}
              onChange={e => updateParam('sort', e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 shadow-sm"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter drawer / popover */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-md animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Filter Products</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Category</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <button
                  onClick={() => updateParam('category_id', '')}
                  className={`block text-xs w-full text-left px-3 py-1.5 rounded-lg transition-colors ${!categoryId ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam('category_id', cat.id)}
                    className={`block text-xs w-full text-left px-3 py-1.5 rounded-lg transition-colors ${categoryId == cat.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Price Range (₹)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceFrom}
                  onChange={e => setPriceFrom(e.target.value)}
                  placeholder="Min"
                  className="input-field w-24 text-xs"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  value={priceTo}
                  onChange={e => setPriceTo(e.target.value)}
                  placeholder="Max"
                  className="input-field w-24 text-xs"
                />
              </div>
              <button
                onClick={applyPriceFilter}
                className="mt-3 btn-primary text-xs py-1.5 px-4"
              >
                Apply Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category navigation pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          <button
            onClick={() => updateParam('category_id', '')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!categoryId ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-300'}`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => updateParam('category_id', cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${categoryId == cat.id ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No products found"
          description="We couldn't find any products matching your selected filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-5">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination page={page} pages={pages} onPageChange={p => updateParam('page', p)} />
        </>
      )}
    </div>
  )
}

