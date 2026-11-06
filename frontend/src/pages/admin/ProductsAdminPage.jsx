import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, Star,
  Package, ExternalLink, RefreshCw, AlertCircle, Sparkles,
  Download, Upload, Layers
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
  const [isBulkImporterOpen, setIsBulkImporterOpen] = useState(false)
  const [initialImportData, setInitialImportData] = useState(null)
  const [initialBulkData, setInitialBulkData] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)

  // Listen for 1-Click Bookmarklet importData, bulkImport (window.name) & bulkImportData in URL
  useEffect(() => {
    const importParam = searchParams.get('importData')
    const bulkParam = searchParams.get('bulkImportData')
    const isBulkWindowName = searchParams.get('bulkImport') === '1'

    if (isBulkWindowName) {
      try {
        const rawName = window.name
        if (rawName && rawName.startsWith('[')) {
          const parsed = JSON.parse(rawName)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInitialBulkData(parsed)
            setIsBulkImporterOpen(true)
            window.name = '' // Clear window name after reading
            const p = new URLSearchParams(searchParams)
            p.delete('bulkImport')
            setSearchParams(p, { replace: true })
            return
          }
        }
      } catch (err) {
        console.error('Failed to parse window.name bulk data', err)
      }
    }

    if (bulkParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(bulkParam))
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInitialBulkData(parsed)
          setIsBulkImporterOpen(true)
          const p = new URLSearchParams(searchParams)
          p.delete('bulkImportData')
          setSearchParams(p, { replace: true })
        }
      } catch (err) {
        console.error('Failed to parse bulk import data', err)
      }
    } else if (importParam) {
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

  const fetchProducts = async (isInitial = false) => {
    if (isInitial || products.length === 0) setLoading(true)
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
    fetchProducts(products.length === 0)
  }, [searchParams])

  const updateParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  // Instant Optimistic Toggle Status (0ms)
  const handleToggleStatus = async (product) => {
    const prevStatus = product.is_active
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !prevStatus } : p))
    toast.success(`Product ${!prevStatus ? 'activated' : 'deactivated'}`)
    try {
      await productsAdminAPI.update(product.id, { is_active: !prevStatus })
    } catch {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: prevStatus } : p))
      toast.error('Failed to update product status')
    }
  }

  // Instant Optimistic Toggle Featured (0ms)
  const handleToggleFeatured = async (product) => {
    const prevFeatured = product.is_featured
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: !prevFeatured } : p))
    toast.success(`Product ${!prevFeatured ? 'added to' : 'removed from'} featured`)
    try {
      await productsAdminAPI.update(product.id, { is_featured: !prevFeatured })
    } catch {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: prevFeatured } : p))
      toast.error('Failed to update featured flag')
    }
  }

  // Instant Optimistic Delete (0ms - disappears immediately!)
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    const prevList = [...products]
    const prevTotal = total
    setProducts(prev => prev.filter(p => p.id !== id))
    setTotal(t => Math.max(0, t - 1))
    toast.success('Product deleted successfully')
    try {
      await productsAdminAPI.delete(id)
    } catch {
      setProducts(prevList)
      setTotal(prevTotal)
      toast.error('Failed to delete product from server')
    }
  }

  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const fileInputRef = useRef(null)

  const handleExportBackup = async () => {
    setBackingUp(true)
    try {
      const res = await productsAdminAPI.backupAll()
      const data = res.data
      const jsonStr = JSON.stringify(data.products, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shopezy-products-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`🎉 Backup exported! (${data.count} products saved)`)
    } catch {
      toast.error('Failed to export backup')
    } finally {
      setBackingUp(false)
    }
  }

  const handleImportRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRestoring(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const list = Array.isArray(parsed) ? parsed : (parsed.products || [])
      if (!list.length) {
        toast.error('No products found in this backup file')
        return
      }
      const res = await productsAdminAPI.restoreAll({ products: list })
      toast.success(`🎉 Successfully restored ${res.data.restored_count} products!`)
      fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error('Failed to restore products. Invalid JSON file.')
    } finally {
      setRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
          {/* Subtle Backup / Restore icons */}
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={backingUp}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors"
            title="Backup all products (JSON)"
          >
            <Download className="w-4 h-4 text-gray-500" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors"
            title="Restore products from backup JSON"
          >
            <Upload className="w-4 h-4 text-gray-500" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportRestore}
            className="hidden"
          />

          {/* Bulk Meesho Importer Button */}
          <button
            type="button"
            onClick={() => setIsBulkImporterOpen(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs py-2.5 px-3.5 rounded-xl font-bold inline-flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>⚡ Bulk Meesho Importer</span>
          </button>

          {/* Single, Clear Primary Add Product Button */}
          <button
            type="button"
            onClick={() => setIsImporterOpen(true)}
            className="bg-gradient-to-r from-purple-700 to-brand-600 hover:from-purple-800 hover:to-brand-700 text-white text-xs py-2.5 px-4 rounded-xl font-black inline-flex items-center gap-2 shadow-md shadow-purple-200 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>+ Add / Import Product</span>
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
      <div className="card overflow-hidden relative">
        {loading && products.length > 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
            <LoadingSpinner size="md" />
          </div>
        )}
        {loading && products.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 px-4 bg-gray-50/70 rounded-xl">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-12 h-14 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-emerald-100 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded-full w-14" />
                <div className="h-7 bg-purple-100 rounded-lg w-16" />
              </div>
            ))}
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

      {/* Bulk Meesho Importer Modal */}
      <BulkProductImporterModal
        isOpen={isBulkImporterOpen}
        initialBulkData={initialBulkData}
        onClose={() => {
          setIsBulkImporterOpen(false)
          setInitialBulkData(null)
        }}
        onSuccess={() => {
          setIsBulkImporterOpen(false)
          setInitialBulkData(null)
          fetchProducts()
        }}
      />
    </div>
  )
}

