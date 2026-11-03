import { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ShoppingBag, Filter } from 'lucide-react'
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
  const { slug } = useParams()
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
  const categorySlugParam = searchParams.get('category') || ''
  const activeCategorySlug = slug || categorySlugParam
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const featured = searchParams.get('featured') || ''

  const [priceFrom, setPriceFrom] = useState(minPrice)
  const [priceTo, setPriceTo] = useState(maxPrice)

  useEffect(() => {
    categoriesAPI.getAll(false).then(res => setCategories(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = { page, sort, limit: 16 }
        if (search) params.search = search
        if (categoryId) params.category_id = categoryId
        if (activeCategorySlug && activeCategorySlug !== 'popular') params.category_slug = activeCategorySlug
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
  }, [searchParams, slug])

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const handlePriceApply = (e) => {
    e.preventDefault()
    const p = new URLSearchParams(searchParams)
    if (priceFrom) p.set('min_price', priceFrom)
    else p.delete('min_price')
    if (priceTo) p.set('max_price', priceTo)
    else p.delete('max_price')
    p.delete('page')
    setSearchParams(p)
  }

  const clearFilters = () => {
    setSearchParams({})
    setPriceFrom('')
    setPriceTo('')
  }

  const hasFilters = categoryId || activeCategorySlug || minPrice || maxPrice || featured || search

  // Find active category name
  const currentCategory = categories.find(c => String(c.id) === String(categoryId) || c.slug === activeCategorySlug)
  const categoryTitle = currentCategory ? currentCategory.name : (search ? `Search results for "${search}"` : 'All Products')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {categoryTitle}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {total} product{total !== 1 ? 's' : ''} with Free Cash on Delivery (COD)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 font-bold ${hasFilters ? 'border-purple-600 text-purple-700 bg-purple-50' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasFilters && <span className="w-2 h-2 rounded-full bg-purple-600" />}
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => updateParam('sort', e.target.value)}
              className="text-xs py-2 pl-3 pr-8 rounded-lg border border-gray-300 bg-white font-medium focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 animate-fade-in text-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800">Filter By</span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-brand-600 hover:underline font-bold">
                Clear All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="font-bold text-gray-700 block mb-2">Category</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <Link
                  to="/products"
                  className={`block text-xs w-full text-left px-3 py-1.5 rounded-lg transition-colors ${!categoryId && !activeCategorySlug ? 'bg-purple-100 text-purple-900 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </Link>
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className={`block text-xs w-full text-left px-3 py-1.5 rounded-lg transition-colors ${categoryId == cat.id || activeCategorySlug === cat.slug ? 'bg-purple-100 text-purple-900 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-2">Price Range (₹)</label>
              <form onSubmit={handlePriceApply} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceFrom}
                    onChange={e => setPriceFrom(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-300"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceTo}
                    onChange={e => setPriceTo(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-300"
                  />
                </div>
                <button type="submit" className="w-full btn-secondary text-xs py-1.5 font-bold">
                  Apply Price Filter
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category navigation pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          <Link
            to="/products"
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${!categoryId && !activeCategorySlug ? 'bg-purple-700 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-400'}`}
          >
            All Products
          </Link>
          {categories.map(cat => {
            const isSelected = categoryId == cat.id || activeCategorySlug === cat.slug
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${isSelected ? 'bg-purple-700 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-400'}`}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-400 font-semibold">Active:</span>
          {activeCategorySlug && (
            <Link to="/products" className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
              <span>{categoryTitle}</span>
              <X className="w-3 h-3" />
            </Link>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">
              <span>"{search}"</span>
              <button onClick={() => updateParam('search', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {minPrice && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">
              <span>Min ₹{minPrice}</span>
              <button onClick={() => updateParam('min_price', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {maxPrice && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">
              <span>Max ₹{maxPrice}</span>
              <button onClick={() => updateParam('max_price', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Product Grid - Meesho Style */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No products found"
          message={hasFilters ? "Try clearing some filters to see more products." : "No products available in this category yet."}
          actionText={hasFilters ? "Clear All Filters" : "Browse All Products"}
          onAction={hasFilters ? clearFilters : () => {}}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} pages={pages} onPageChange={p => updateParam('page', p)} />
    </div>
  )
}
