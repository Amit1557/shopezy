import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, Star,
  Package, ExternalLink, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import MeeshoQuickImporterModal from '../../components/admin/MeeshoQuickImporterModal'
import BulkProductImporterModal from '../../components/admin/BulkProductImporterModal'
import ProductQuickEditModal from '../../components/admin/ProductQuickEditModal'
import toast from 'react-hot-toast'

export default function ProductsAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isImporterOpen, setIsImporterOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [initialImportData, setInitialImportData] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)

  // Listen for 1-Click Bookmarklet importData in URL
  useEffect(() => {
    const importParam = searchParams.get('importData')
    if (importParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(importParam))
        setInitialImportData(parsed)
        setIsImporterOpen(true)
        const p = new URLSearchParams(searchParams)
        p.delete('importData')
        setSearchParams(p, { replace: true })
      } catch (err) {
        console.error('Failed to parse import data', err)
      }
    }
  }, [searchParams])

  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('category_id') || ''
  const [searchInput, setSearchInput] = useState(search)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (search) params.search = search
      if (categoryId) params.category_id = categoryId
      const [prodRes, catRes] = await Promise.all([
        productsAdminAPI.getAll(params),
        categoriesAPI.getAll(false)
      ])
      setProducts(prodRes.data.products || [])
      setTotal(prodRes.data.total || 0)
      setPages(prodRes.data.pages || 1)
      setCategories(catRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [searchParams])

  const updateParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const handleToggleStatus = async (product) => {
    try {
      await productsAdminAPI.update(product.id, { is_active: !product.is_active })
      toast.success(`Product ${product.is_active ? 'deactivated' : 'activated'}`)
      fetchProducts()
    } catch {
      toast.error('Failed to update product status')
    }
  }

  const handleToggleFeatured = async (product) => {
    try {
      await productsAdminAPI.update(product.id, { is_featured: !product.is_featured })
      toast.success(`Product ${product.is_featured ? 'removed from' : 'added to'} featured`)
      fetchProducts()
    } catch {
      toast.error('Failed to update featured flag')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      await productsAdminAPI.delete(id)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Product Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage products sourced from Meesho, adjust selling prices & margins</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImporterOpen(true)}
            className="bg-gradient-to-r from-purple-700 to-brand-600 hover:from-purple-800 hover:to-brand-700 text-white text-xs py-2.5 px-3.5 rounded-xl font-black inline-flex items-center gap-1.5 shadow-md shadow-purple-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>⚡ 1-Click Fast Import</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="bg-gradient-to-r from-purple-900 to-indigo-800 hover:from-purple-950 hover:to-indigo-900 text-white text-xs py-2.5 px-3.5 rounded-xl font-black inline-flex items-center gap-1.5 shadow-md shadow-purple-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>⚡ Bulk Product Importer</span>
          </button>

          <Link
            to="/admin/products/new"
            className="btn-secondary text-xs py-2.5 px-3 inline-flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-4 h-4" /> Custom Form
          </Link>
        </div>
      </div>

      {/* Tareeka A: 1-Click Meesho Direct Bookmarklet Importer */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-pink-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl border border-purple-700">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25 shadow-inner">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                ⚡ 1-Click Meesho Direct Auto-Importer
              </h2>
              <span className="text-[10px] bg-yellow-400 text-purple-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Tareeka A (Recommended)
              </span>
            </div>
            <p className="text-xs text-purple-100 mt-1 max-w-2xl leading-relaxed">
              Neeche diye gaye yellow button ko apne Chrome Bookmarks bar (press <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono text-[11px] font-bold">Ctrl+Shift+B</kbd>) me drag karein. Meesho par koi bhi item dekhte waqt bas 1 click karein—Photos, Meesho Price, Sizes aur Category turant auto-import ho jayenge!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={`javascript:(function(){try{var t=document.querySelector('h1')?.innerText||document.title.replace(/\\s*\\|.*$/,'').trim();var p=0;var pm=document.body.innerText.match(/₹\\s*([0-9]+)/);if(pm)p=parseFloat(pm[1]);var imgs=[];document.querySelectorAll('img[src*="images.meesho.com"]').forEach(function(el){var s=el.src;if(s&&!s.includes('avatar')&&!s.includes('icon')&&imgs.indexOf(s)===-1){var c=s.replace(/_[0-9]+\\.(jpg|webp|jpeg)/,'.jpg');if(imgs.indexOf(c)===-1)imgs.push(c);}});var sizes=[];var allSpans=Array.from(document.querySelectorAll('span,button,p,div'));var sizeLabel=allSpans.find(function(el){return el.children.length===0&&/^select\\s*size$/i.test(el.innerText.trim());});if(sizeLabel&&sizeLabel.parentElement){var container=sizeLabel.parentElement;var buttons=container.querySelectorAll('span,button,div');buttons.forEach(function(b){var txt=b.innerText.trim();if(/^(2[6-9]|3[0-9]|4[0-6]|XS|S|M|L|XL|XXL|3XL|Free Size|IND-\\d+|UK-\\d+)$/i.test(txt)){if(sizes.indexOf(txt)===-1)sizes.push(txt);}});}if(sizes.length===0){var lower=(t+' '+window.location.href).toLowerCase();var isBottom=/jean|cargo|jogger|pant|trouser|bottom|chinos/i.test(lower);if(isBottom){var wm=document.body.innerText.match(/\\b(2[68]|3[02468]|4[0246])\\b/g);if(wm){wm.forEach(function(w){if(sizes.indexOf(w)===-1&&sizes.length<8)sizes.push(w);});}}var sm=document.body.innerText.match(/\\b(IND-\\d+|UK-\\d+|XS|S|M|L|XL|XXL|3XL|Free Size)\\b/gi);if(sm){sm.forEach(function(s){var u=s.toUpperCase();if(sizes.indexOf(u)===-1&&sizes.length<8)sizes.push(u);});}}var defaultSizes=['Free Size'];var lowerTitle=t.toLowerCase();if(/jean|cargo|jogger|pant|trouser/i.test(lowerTitle))defaultSizes=['30','32','34','36'];else if(/shoe|sneaker|footwear/i.test(lowerTitle))defaultSizes=['IND-6','IND-7','IND-8','IND-9','IND-10'];else if(/shirt|kurti|dress|t-shirt|top/i.test(lowerTitle))defaultSizes=['S','M','L','XL','XXL'];var d={name:t,purchase_cost:p,meesho_link:window.location.href,images:imgs.slice(0,6),sizes:sizes.length?sizes:defaultSizes};window.open('${typeof window !== 'undefined' ? window.location.origin : ''}/admin/products?importData='+encodeURIComponent(JSON.stringify(d)),'_blank');}catch(e){alert('Error: '+e.message);}})();`}
            onClick={(e) => {
              if (e.button === 0) {
                toast('📌 Is yellow button ko apne Chrome Bookmarks Bar me drag & drop karein!', { icon: '💡' })
              }
            }}
            className="bg-yellow-400 hover:bg-yellow-300 text-purple-950 font-black text-xs sm:text-sm py-3 px-5 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-grab active:cursor-grabbing border-2 border-yellow-200"
            title="Drag this button to your Chrome Bookmarks Bar"
          >
            <Sparkles className="w-4 h-4 text-purple-950 fill-purple-950" />
            <span>⚡ Add to ShopEzy</span>
          </a>

          <button
            type="button"
            onClick={() => setIsImporterOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 px-3.5 rounded-xl border border-white/20 transition-all cursor-pointer"
            title="Open Importer Popup"
          >
            Open Popup
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={e => { e.preventDefault(); updateParam('search', searchInput.trim()) }} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search product title..."
              className="input-field pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button type="submit" className="btn-primary text-xs px-4 font-bold">Search</button>
        </form>

        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={e => updateParam('category_id', e.target.value)}
            className="input-field text-xs font-medium w-auto"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={fetchProducts} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-gray-700">No Products Found</h3>
            <p className="text-xs text-gray-500 mt-1">Get started by listing your first product from Meesho.</p>
            <Link to="/admin/products/new" className="btn-primary text-xs inline-flex mt-4">
              Add New Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Meesho Sourcing Cost</th>
                  <th className="py-3 px-4">Selling Price (COD)</th>
                  <th className="py-3 px-4">Expected Profit Margin</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => {
                  const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url
                  const margin = p.selling_price - p.purchase_cost
                  const marginPercent = p.selling_price > 0 ? Math.round((margin / p.selling_price) * 100) : 0

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 max-w-xs">
                          <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                            {primaryImg ? (
                              <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 line-clamp-1">{p.name}</h3>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                              <span>Orders: {p.total_orders}</span>
                              {p.meesho_link && (
                                <a
                                  href={p.meesho_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-600 hover:underline flex items-center gap-0.5"
                                  title="View Meesho source item"
                                >
                                  Meesho <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sourcing Cost */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-600">
                          {formatPrice(p.purchase_cost)}
                        </span>
                        <div className="text-[10px] text-gray-400">Internal Cost</div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-gray-900 text-sm">
                          {formatPrice(p.selling_price)}
                        </span>
                        {p.original_price && p.original_price > p.selling_price && (
                          <div className="text-[10px] text-gray-400 line-through">
                            MRP: {formatPrice(p.original_price)}
                          </div>
                        )}
                      </td>

                      {/* Expected Margin */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          +{formatPrice(margin)} ({marginPercent}%)
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            p.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {p.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Featured */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            p.is_featured
                              ? 'border-yellow-400 bg-yellow-50 text-yellow-600'
                              : 'border-gray-200 text-gray-300 hover:text-gray-600'
                          }`}
                          title="Toggle featured showcase"
                        >
                          <Star className={`w-3.5 h-3.5 ${p.is_featured ? 'fill-yellow-400' : ''}`} />
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 text-xs py-1 px-2.5 rounded-lg font-bold inline-flex items-center gap-1 border border-purple-200 transition-colors cursor-pointer"
                            title="Edit Price, Photos, Sizes & Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-600 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pages={pages} onPageChange={p => updateParam('page', p)} />

      {/* Quick Edit Modal (Price, Photos, Sizes, Details) */}
      <ProductQuickEditModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdated={() => {
          setEditingProduct(null)
          fetchProducts()
        }}
      />

      {/* 1-Click Meesho Fast Importer Modal */}
      <MeeshoQuickImporterModal
        isOpen={isImporterOpen}
        initialData={initialImportData}
        onClose={() => {
          setIsImporterOpen(false)
          setInitialImportData(null)
        }}
        onSuccess={() => {
          setIsImporterOpen(false)
          setInitialImportData(null)
          fetchProducts()
        }}
      />

      {/* 1-Click Bulk Product Importer Modal */}
      <BulkProductImporterModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => {
          setIsBulkOpen(false)
          fetchProducts()
        }}
      />
    </div>
  )
}

