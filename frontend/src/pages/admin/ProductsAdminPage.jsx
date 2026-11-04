import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, Star,
  Package, ExternalLink, RefreshCw, AlertCircle, Sparkles,
  Download, Upload
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import MeeshoQuickImporterModal from '../../components/admin/MeeshoQuickImporterModal'
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
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={backingUp}
            className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 font-bold"
            title="Download JSON backup of all your products"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>{backingUp ? 'Exporting...' : 'Backup JSON'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 font-bold"
            title="Restore products from JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>{restoring ? 'Restoring...' : 'Restore'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportRestore}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setIsImporterOpen(true)}
            className="bg-gradient-to-r from-purple-700 to-brand-600 hover:from-purple-800 hover:to-brand-700 text-white text-xs py-2.5 px-3.5 rounded-xl font-black inline-flex items-center gap-1.5 shadow-md shadow-purple-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>⚡ 1-Click Fast Import</span>
          </button>

          <Link
            to="/admin/products/new"
            className="btn-secondary text-xs py-2.5 px-3 inline-flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-4 h-4" /> Custom Form
          </Link>
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
    </div>
  )
}

