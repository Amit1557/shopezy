import { useState, useEffect } from 'react'
import {
  Sparkles, X, Plus, Trash2, Upload, Download, CheckCircle,
  AlertCircle, TrendingUp, ArrowRight, ExternalLink, Layers, FileText
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../ui/LoadingSpinner'
import { isCleanProductImage } from './MeeshoQuickImporterModal'
import toast from 'react-hot-toast'

export default function BulkProductImporterModal({ isOpen, onClose, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [tab, setTab] = useState('paste') // 'paste', 'grid', 'csv'
  const [parsing, setParsing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState(null)

  // Multi-paste text
  const [multiRawText, setMultiRawText] = useState('')
  const [globalMarkup, setGlobalMarkup] = useState('250')

  // Products staging list
  const [stagedProducts, setStagedProducts] = useState([])

  useEffect(() => {
    if (isOpen) {
      categoriesAPI.getAll(false).then(res => setCategories(res.data || [])).catch(() => {})
      // Initialize with 2 empty rows if empty
      if (stagedProducts.length === 0) {
        setStagedProducts([
          createEmptyRow(1),
          createEmptyRow(2)
        ])
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  function createEmptyRow(idx = 1) {
    return {
      id: Date.now() + idx,
      name: '',
      category_slug: 'mens-fashion',
      category_id: categories[0]?.id || 1,
      purchase_cost: '',
      selling_price: '',
      original_price: '',
      images: [],
      imageUrlInput: '',
      sizes: ['S', 'M', 'L', 'XL'],
      meesho_link: ''
    }
  }

  // Handle Multi-Link Parse
  const handleBulkParse = async () => {
    if (!multiRawText.trim()) {
      toast.error('Please paste at least one Meesho link or product text')
      return
    }

    setParsing(true)
    try {
      const res = await productsAdminAPI.bulkParseMeesho({
        raw_text: multiRawText.trim(),
        default_markup: parseFloat(globalMarkup) || 250
      })
      const items = res.data.items || []

      if (items.length === 0) {
        toast.error('No valid products detected. Please check your links/text.')
        return
      }

      const formatted = items.map((p, idx) => {
        const cost = p.purchase_cost || 0
        const sell = p.selling_price || (cost > 0 ? cost + (parseFloat(globalMarkup) || 250) : 599)
        const orig = p.original_price || (sell + 200)

        // Find category ID
        let catId = categories[0]?.id || 1
        if (p.category_slug) {
          const match = categories.find(c => c.slug === p.category_slug)
          if (match) catId = match.id
        }

        return {
          id: Date.now() + idx,
          name: p.name || `Meesho Product ${idx + 1}`,
          category_slug: p.category_slug || 'mens-fashion',
          category_id: catId,
          purchase_cost: cost ? String(cost) : '',
          selling_price: String(sell),
          original_price: String(orig),
          images: (p.images || []).filter(isCleanProductImage),
          imageUrlInput: '',
          sizes: p.sizes?.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL'],
          meesho_link: p.meesho_link || ''
        }
      })

      setStagedProducts(formatted)
      setTab('grid') // switch to review table
      toast.success(`Successfully parsed ${formatted.length} products! Review and publish below.`)
    } catch {
      toast.error('Failed to parse input. You can enter details in the table.')
    } finally {
      setParsing(false)
    }
  }

  // Apply global markup to all rows
  const applyGlobalMarkup = () => {
    const markup = parseFloat(globalMarkup) || 0
    if (markup <= 0) {
      toast.error('Please enter a valid markup amount (e.g. 250)')
      return
    }

    setStagedProducts(prev => prev.map(p => {
      const cost = parseFloat(p.purchase_cost) || 0
      if (cost > 0) {
        const sell = cost + markup
        return {
          ...p,
          selling_price: String(sell),
          original_price: String(sell + 200)
        }
      }
      return p
    }))
    toast.success(`Applied ₹${markup} profit markup to all products!`)
  }

  // Row update helpers
  const updateRow = (id, field, value) => {
    setStagedProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value }
        // Auto-calc sell price if cost changed and sell is empty
        if (field === 'purchase_cost' && (!p.selling_price || parseFloat(p.selling_price) <= 0)) {
          const cost = parseFloat(value) || 0
          if (cost > 0) {
            const sell = cost + (parseFloat(globalMarkup) || 250)
            updated.selling_price = String(sell)
            updated.original_price = String(sell + 200)
          }
        }
        return updated
      }
      return p
    }))
  }

  const removeRow = (id) => {
    setStagedProducts(prev => prev.filter(p => p.id !== id))
  }

  const addNewRow = () => {
    setStagedProducts(prev => [...prev, createEmptyRow(prev.length + 1)])
  }

  // CSV Template download
  const downloadSampleCsv = () => {
    const csvContent = `Product Name,Meesho Cost,Selling Price,Category,Image URL,Sizes
Men Slim Fit Cotton Shirt,280,599,mens-fashion,https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600,S;M;L;XL
Women Pure Cotton Kurta Set,420,899,womens-fashion,https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600,M;L;XL
Breathable Running Sports Shoes,340,699,footwear,https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600,UK 6;UK 7;UK 8;UK 9`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'shopezy_bulk_products_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // CSV file parse
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 2) {
          toast.error('CSV file is empty or missing headers')
          return
        }

        const parsed = []
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim())
          if (parts.length >= 2 && parts[0]) {
            const name = parts[0]
            const cost = parseFloat(parts[1]) || 0
            const sell = parseFloat(parts[2]) || (cost + 250)
            const catSlug = parts[3] || 'mens-fashion'
            const imgUrl = parts[4] || ''
            const sizesStr = parts[5] || 'S;M;L;XL'
            const sizes = sizesStr.split(';').map(s => s.trim()).filter(Boolean)

            let catId = categories[0]?.id || 1
            const match = categories.find(c => c.slug === catSlug)
            if (match) catId = match.id

            parsed.push({
              id: Date.now() + i,
              name,
              category_slug: catSlug,
              category_id: catId,
              purchase_cost: cost ? String(cost) : '',
              selling_price: String(sell),
              original_price: String(sell + 200),
              images: imgUrl ? [imgUrl] : [],
              imageUrlInput: '',
              sizes: sizes.length > 0 ? sizes : ['Free Size'],
              meesho_link: ''
            })
          }
        }

        if (parsed.length > 0) {
          setStagedProducts(parsed)
          setTab('grid')
          toast.success(`Loaded ${parsed.length} products from CSV! Ready to publish.`)
        } else {
          toast.error('Could not find valid product rows in CSV')
        }
      } catch {
        toast.error('Failed to parse CSV file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Execute 1-Click Bulk Publish
  const handleBulkPublish = async () => {
    // Validate
    const validProducts = stagedProducts.filter(p => p.name.trim() && parseFloat(p.selling_price) > 0)
    if (validProducts.length === 0) {
      toast.error('Please ensure at least one product has a title and selling price')
      return
    }

    setPublishing(true)
    try {
      const payload = {
        products: validProducts.map(p => ({
          name: p.name.trim(),
          category_id: parseInt(p.category_id) || undefined,
          category_slug: p.category_slug,
          purchase_cost: parseFloat(p.purchase_cost) || 0.0,
          selling_price: parseFloat(p.selling_price),
          original_price: parseFloat(p.original_price) || (parseFloat(p.selling_price) + 200),
          images: (p.images || []).filter(isCleanProductImage),
          sizes: p.sizes,
          colors: [],
          is_active: true,
          cod_available: true,
          stock_quantity: 100,
          meesho_link: p.meesho_link || undefined
        }))
      }

      const res = await productsAdminAPI.bulkPublish(payload)
      setResult(res.data)
      toast.success(`🎉 ${res.data.count} products successfully published in 1 click!`)
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to bulk publish products')
    } finally {
      setPublishing(false)
    }
  }

  // Summary counts
  const validCount = stagedProducts.filter(p => p.name.trim() && parseFloat(p.selling_price) > 0).length
  const totalCost = stagedProducts.reduce((sum, p) => sum + (parseFloat(p.purchase_cost) || 0), 0)
  const totalSell = stagedProducts.reduce((sum, p) => sum + (parseFloat(p.selling_price) || 0), 0)
  const totalExpectedProfit = totalSell - totalCost

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-brand-800 to-purple-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Layers className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">⚡ 1-Click Bulk Product Importer</h2>
              <p className="text-xs text-purple-200">List 5, 10 or 20 products from Meesho or CSV simultaneously into your store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Result Celebratory Screen */}
        {result ? (
          <div className="p-10 text-center space-y-5 animate-fade-in my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <span className="badge badge-success text-xs font-bold px-3 py-1 mb-2 inline-block">
                Bulk Listing Complete
              </span>
              <h3 className="text-2xl font-black text-gray-900">
                {result.count} Products Published Live!
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                All selected products have been added to your catalog with images, categories, variant sizes, and Cash on Delivery enabled.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <a
                href="/products"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs py-2.5 px-6 font-bold inline-flex items-center justify-center gap-2 shadow-brand"
              >
                <ExternalLink className="w-4 h-4" /> View Products on Storefront
              </a>
              <button
                onClick={() => { setResult(null); onClose(); }}
                className="btn-secondary text-xs py-2.5 px-6 font-bold"
              >
                Close Importer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Toolbar / Method Selector */}
            <div className="bg-purple-50/70 border-b border-purple-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-xl bg-white p-1 border border-purple-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setTab('paste')}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                    tab === 'paste' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  1. Paste Multi-Meesho Links
                </button>
                <button
                  type="button"
                  onClick={() => setTab('grid')}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                    tab === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  2. Review & Edit Products ({stagedProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab('csv')}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                    tab === 'csv' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  3. Excel / CSV Upload
                </button>
              </div>

              {/* Global Markup Tool */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-purple-200">
                <span className="text-[11px] font-bold text-gray-700">Global Markup:</span>
                <div className="relative w-20">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={globalMarkup}
                    onChange={(e) => setGlobalMarkup(e.target.value)}
                    className="w-full text-xs font-black pl-5 pr-1 py-1 border rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyGlobalMarkup}
                  className="btn-secondary text-[10px] py-1 px-2.5 font-bold"
                  title="Apply this profit markup to all products with cost"
                >
                  Apply All
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* TAB 1: PASTE MULTI-LINKS */}
              {tab === 'paste' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Bulk Link Paste Guide:
                    </p>
                    <p className="text-[11px] text-purple-800">
                      You can paste 5, 10 or 20 Meesho product URLs or WhatsApp descriptions at once. Paste them separated by new lines or <code className="bg-white px-1 rounded border">---</code>.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Paste Meesho URLs or Descriptions:
                    </label>
                    <textarea
                      rows={8}
                      value={multiRawText}
                      onChange={(e) => setMultiRawText(e.target.value)}
                      placeholder={`https://www.meesho.com/s/p/abc123\nhttps://www.meesho.com/s/p/xyz456\n---\nProduct Name: Floral Cotton Kurti\nPrice: Rs. 380\nSizes: M, L, XL`}
                      className="input-field text-xs font-mono resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-gray-400">
                      Auto-extracts titles, costs, sizes & photos
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkParse}
                      disabled={parsing || !multiRawText.trim()}
                      className="btn-primary text-xs py-2.5 px-6 font-black shadow-brand flex items-center gap-2"
                    >
                      {parsing ? <LoadingSpinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                      Parse & Load into Table
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EDITABLE BATCH TABLE */}
              {tab === 'grid' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-gray-900">
                        Products Ready for Publishing ({validCount} Valid)
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Edit titles, verify selling prices, or change categories before publishing.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addNewRow}
                      className="btn-secondary text-xs py-1.5 px-3 font-bold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3 w-16">Image</th>
                            <th className="py-2.5 px-3 min-w-[200px]">Product Title *</th>
                            <th className="py-2.5 px-3 w-36">Category</th>
                            <th className="py-2.5 px-3 w-24">Meesho Cost</th>
                            <th className="py-2.5 px-3 w-28 text-brand-700">Selling Price *</th>
                            <th className="py-2.5 px-3 w-24 text-emerald-700">Profit</th>
                            <th className="py-2.5 px-3 min-w-[140px]">Sizes</th>
                            <th className="py-2.5 px-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {stagedProducts.map((p, idx) => {
                            const cost = parseFloat(p.purchase_cost) || 0
                            const sell = parseFloat(p.selling_price) || 0
                            const profit = sell - cost

                            return (
                              <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                                {/* Image preview or quick URL */}
                                <td className="py-2 px-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                    {p.images?.[0] ? (
                                      <img src={p.images[0]} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] text-gray-400 font-bold">Auto</span>
                                    )}
                                  </div>
                                </td>

                                {/* Name */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={p.name}
                                    onChange={(e) => updateRow(p.id, 'name', e.target.value)}
                                    placeholder="Product title..."
                                    className="w-full text-xs font-semibold py-1 px-2 border rounded-md"
                                  />
                                </td>

                                {/* Category */}
                                <td className="py-2 px-3">
                                  <select
                                    value={p.category_id}
                                    onChange={(e) => {
                                      const cat = categories.find(c => String(c.id) === e.target.value)
                                      updateRow(p.id, 'category_id', e.target.value)
                                      if (cat) updateRow(p.id, 'category_slug', cat.slug)
                                    }}
                                    className="w-full text-xs py-1 px-2 border rounded-md"
                                  >
                                    {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Meesho Cost */}
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    value={p.purchase_cost}
                                    onChange={(e) => updateRow(p.id, 'purchase_cost', e.target.value)}
                                    placeholder="Cost"
                                    className="w-full text-xs font-semibold py-1 px-2 border rounded-md"
                                  />
                                </td>

                                {/* Selling Price */}
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    value={p.selling_price}
                                    onChange={(e) => updateRow(p.id, 'selling_price', e.target.value)}
                                    placeholder="Sell ₹"
                                    className="w-full text-xs font-black text-brand-600 py-1 px-2 border border-brand-300 rounded-md bg-purple-50/30"
                                  />
                                </td>

                                {/* Profit */}
                                <td className="py-2 px-3">
                                  <span className={`font-black text-xs ${profit > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    {profit > 0 ? `+${formatPrice(profit)}` : '—'}
                                  </span>
                                </td>

                                {/* Sizes */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={p.sizes.join(', ')}
                                    onChange={(e) => updateRow(p.id, 'sizes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="S, M, L, XL..."
                                    className="w-full text-[11px] py-1 px-2 border rounded-md font-mono"
                                  />
                                </td>

                                {/* Delete row */}
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeRow(p.id)}
                                    className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CSV UPLOAD */}
              {tab === 'csv' && (
                <div className="space-y-5 max-w-xl mx-auto py-4">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center space-y-2">
                    <FileText className="w-8 h-8 text-purple-600 mx-auto" />
                    <h4 className="text-xs font-black text-purple-900">Upload CSV / Excel Spreadsheet</h4>
                    <p className="text-[11px] text-purple-700">
                      Upload a CSV file containing your product names, costs, selling prices, and image URLs.
                    </p>
                    <button
                      type="button"
                      onClick={downloadSampleCsv}
                      className="btn-secondary text-[11px] py-1.5 px-3 font-bold inline-flex items-center gap-1.5 mt-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <label htmlFor="csv-file-input" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-700">Click to upload your .CSV spreadsheet</p>
                      <p className="text-[10px] text-gray-400 mt-1">Supports any spreadsheet with standard headers</p>
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer & 1-Click Final Button */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                <span>Selected: <strong className="text-gray-900 font-bold">{validCount} Products</strong></span>
                {totalExpectedProfit > 0 && (
                  <span className="ml-3 text-emerald-600 font-bold">
                    Total Estimated Profit: +{formatPrice(totalExpectedProfit)}
                  </span>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs py-2.5 px-4 font-bold flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkPublish}
                  disabled={publishing || validCount === 0}
                  className="bg-gradient-to-r from-purple-700 to-brand-600 hover:from-purple-800 hover:to-brand-700 text-white text-xs py-2.5 px-6 rounded-xl font-black shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                >
                  {publishing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Publishing {validCount} Products...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>🚀 1-Click Publish All ({validCount}) to Store</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

