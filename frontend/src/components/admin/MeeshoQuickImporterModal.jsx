import { useState, useEffect } from 'react'
import {
  Sparkles, Link as LinkIcon, DollarSign, Image as ImageIcon,
  CheckCircle, ArrowRight, ExternalLink, X, Plus, Trash2,
  TrendingUp, ShieldCheck, RefreshCw, Upload, AlertCircle
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MeeshoQuickImporterModal({ isOpen, onClose, onSuccess }) {
  const [categories, setCategories] = useState([])
  
  // Step / Mode
  const [parsing, setParsing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedProduct, setPublishedProduct] = useState(null)

  // Input fields
  const [rawText, setRawText] = useState('')
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categorySlug, setCategorySlug] = useState('mens-fashion')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [meeshoLink, setMeeshoLink] = useState('')
  const [images, setImages] = useState([])
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [sizes, setSizes] = useState(['S', 'M', 'L', 'XL'])
  const [newSize, setNewSize] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  // Load categories
  useEffect(() => {
    if (isOpen) {
      categoriesAPI.getAll(false).then(res => {
        setCategories(res.data || [])
        if (res.data?.length > 0 && !categoryId) {
          setCategoryId(String(res.data[0].id))
        }
      }).catch(() => {})
    }
  }, [isOpen])

  // Clipboard paste listener for images (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return

    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            e.preventDefault()
            setUploading(true)
            try {
              const formData = new FormData()
              formData.append('file', blob, `pasted-image-${Date.now()}.png`)
              const res = await productsAdminAPI.uploadImage(formData)
              setImages(prev => [...prev, res.data.image_url])
              toast.success('Pasted image attached successfully!')
            } catch {
              toast.error('Failed to attach pasted image')
            } finally {
              setUploading(false)
            }
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen])

  if (!isOpen) return null

  // Reset all fields
  const resetForm = () => {
    setPublishedProduct(null)
    setRawText('')
    setName('')
    setPurchaseCost('')
    setSellingPrice('')
    setOriginalPrice('')
    setMeeshoLink('')
    setImages([])
    setImageUrlInput('')
    setSizes(['S', 'M', 'L', 'XL'])
    setDescription('')
  }

  // Handle parsing Meesho text or link
  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error('Please paste a Meesho link or product description first')
      return
    }

    setParsing(true)
    try {
      const res = await productsAdminAPI.parseMeesho({
        raw_text: rawText.trim(),
        meesho_cost: purchaseCost ? parseFloat(purchaseCost) : undefined
      })
      const data = res.data

      if (data.name) setName(data.name)
      if (data.purchase_cost) setPurchaseCost(String(data.purchase_cost))
      if (data.selling_price) setSellingPrice(String(data.selling_price))
      if (data.original_price) setOriginalPrice(String(data.original_price))
      if (data.meesho_link) setMeeshoLink(data.meesho_link)
      if (data.description) setDescription(data.description)
      if (data.sizes?.length > 0) setSizes(data.sizes)
      if (data.images?.length > 0) {
        setImages(prev => Array.from(new Set([...prev, ...data.images])))
      }

      // Match category
      if (data.category_slug) {
        setCategorySlug(data.category_slug)
        const match = categories.find(c => c.slug === data.category_slug)
        if (match) setCategoryId(String(match.id))
      }

      toast.success('Meesho details extracted! Set your selling price below and click publish.')
    } catch {
      toast.error('Could not auto-parse Meesho text. You can still fill in the details manually.')
    } finally {
      setParsing(false)
    }
  }

  // Handle local file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await productsAdminAPI.uploadImage(formData)
      setImages(prev => [...prev, res.data.image_url])
      toast.success('Image uploaded!')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Add image by URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return
    const url = imageUrlInput.trim()
    if (!images.includes(url)) {
      setImages(prev => [...prev, url])
      setImageUrlInput('')
      toast.success('Image URL added')
    }
  }

  // Remove image
  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  // Size toggle
  const toggleSize = (sz) => {
    if (sizes.includes(sz)) {
      setSizes(sizes.filter(s => s !== sz))
    } else {
      setSizes([...sizes, sz])
    }
  }

  const addCustomSize = (e) => {
    e.preventDefault()
    if (!newSize.trim()) return
    if (!sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()])
    }
    setNewSize('')
  }

  // Calculate profit
  const costNum = parseFloat(purchaseCost) || 0
  const sellNum = parseFloat(sellingPrice) || 0
  const profitNum = sellNum - costNum
  const profitMarginPercent = sellNum > 0 ? Math.round((profitNum / sellNum) * 100) : 0

  // 1-Click Publish
  const handle1ClickPublish = async () => {
    if (!name.trim()) {
      toast.error('Product title is required')
      return
    }
    if (!sellNum || sellNum <= 0) {
      toast.error('Please enter a valid Selling Price')
      return
    }

    setPublishing(true)
    try {
      const payload = {
        name: name.trim(),
        selling_price: sellNum,
        purchase_cost: costNum,
        original_price: parseFloat(originalPrice) || (sellNum + 200),
        category_id: categoryId ? parseInt(categoryId) : undefined,
        category_slug: categorySlug,
        description: description || undefined,
        meesho_link: meeshoLink || undefined,
        images: images,
        sizes: sizes.length > 0 ? sizes : ['Free Size'],
        colors: [],
        is_active: true,
        is_featured: false,
        cod_available: true,
        stock_quantity: 100
      }

      const res = await productsAdminAPI.quickPublish(payload)
      setPublishedProduct(res.data)
      toast.success('🎉 Product published live to your website!')
      if (onSuccess) onSuccess(res.data)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to publish product')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100 my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-800 to-brand-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">1-Click Fast Meesho Importer</h2>
              <p className="text-xs text-purple-200">Auto-import Meesho product, set your selling price & publish in 1 click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* SUCCESS SCREEN IF PUBLISHED */}
          {publishedProduct ? (
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="badge badge-success text-xs font-bold px-3 py-1 mb-2 inline-block">
                  Live on Storefront
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1">{publishedProduct.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Product successfully added to catalog and published with Free Cash on Delivery.
                </p>
              </div>

              {/* Price & Margin Pill */}
              <div className="bg-purple-50 rounded-xl p-4 max-w-md mx-auto border border-purple-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Meesho Cost</div>
                  <div className="text-sm font-extrabold text-gray-700">{formatPrice(publishedProduct.purchase_cost)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Selling Price</div>
                  <div className="text-base font-black text-brand-600">{formatPrice(publishedProduct.selling_price)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 uppercase font-bold">Your Profit</div>
                  <div className="text-sm font-black text-emerald-600">
                    +{formatPrice(publishedProduct.selling_price - publishedProduct.purchase_cost)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <a
                  href={`/product/${publishedProduct.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs py-2.5 px-5 inline-flex items-center justify-center gap-2 font-bold shadow-brand"
                >
                  <ExternalLink className="w-4 h-4" /> View Live on Website
                </a>
                <button
                  onClick={resetForm}
                  className="btn-secondary text-xs py-2.5 px-5 font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Import Another Meesho Product
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: PASTE MEESHO CONTENT */}
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Paste Meesho Product Link or Copied Description
                  </label>
                  <span className="text-[11px] text-purple-700 font-medium">Smart Auto-Detect</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste Meesho link (e.g. https://www.meesho.com/s/p/...) or WhatsApp share text..."
                    className="input-field text-xs resize-none bg-white font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-between items-center gap-2 pt-1">
                  <p className="text-[11px] text-gray-500">
                    Paste any Meesho URL or text. We will extract title, cost, sizes & images.
                  </p>
                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={parsing || !rawText.trim()}
                    className="btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5 shrink-0"
                  >
                    {parsing ? <LoadingSpinner size="sm" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Extract Details
                  </button>
                </div>
              </div>

              {/* PRODUCT TITLE & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700">Product Title *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Men Slim Fit Casual Cotton Shirt"
                    className="input-field text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input-field text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 2: PHOTO / IMAGES (As requested by user: photo auto-upload & copy-paste) */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    Product Photo(s)
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Tip: Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600 border font-mono">Ctrl+V</kbd> anywhere to paste copied Meesho image
                  </span>
                </div>

                {/* Image Thumbnails */}
                <div className="flex flex-wrap gap-2 items-center">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                      <img src={img} alt="Product" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-purple-600 text-white text-[8px] font-black text-center py-0.5">
                          MAIN
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Controls */}
                  <div className="flex flex-wrap gap-2 items-center flex-1">
                    <label className="cursor-pointer border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 text-purple-700 rounded-lg w-16 h-16 flex flex-col items-center justify-center gap-1 text-[9px] font-bold transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <span>{uploading ? '...' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {/* Image URL input */}
                    <div className="flex-1 flex gap-1 min-w-[200px]">
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl() } }}
                        placeholder="Paste image URL (e.g. from Meesho)..."
                        className="input-field text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="btn-secondary text-xs px-2.5 font-bold shrink-0"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                </div>

                {images.length === 0 && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    No image added yet. If left blank, a high-quality product photo matching this category will be auto-assigned.
                  </p>
                )}
              </div>

              {/* STEP 3: PRICE SETTING & PROFIT MARGIN (Under user's direct control) */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-purple-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    Pricing & Profit Margin Control (You Decide)
                  </label>
                  <span className="badge badge-success text-[10px] font-extrabold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Live Margin Calculator
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Meesho Purchase Cost */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Meesho Cost (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={purchaseCost}
                        onChange={(e) => setPurchaseCost(e.target.value)}
                        placeholder="e.g. 320"
                        className="input-field pl-7 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>

                  {/* Customer Selling Price (Highlight) */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-brand-700 flex items-center gap-1">
                      Selling Price (₹) *
                      <span className="text-[10px] font-normal text-brand-500">(Customer Pays)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600 font-black text-sm">₹</span>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="e.g. 599"
                        className="input-field pl-7 text-sm font-black text-brand-700 border-brand-400 ring-2 ring-brand-100 bg-white"
                      />
                    </div>
                  </div>

                  {/* MRP / Original Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">MRP Reference (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="e.g. 999"
                        className="input-field pl-7 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Profit Summary Bar */}
                <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 text-[11px]">Your Expected Profit per Order:</span>
                    <div className="text-base font-black text-emerald-600">
                      {profitNum > 0 ? `+${formatPrice(profitNum)}` : '₹0'}
                      {sellNum > 0 && profitNum > 0 && (
                        <span className="text-xs font-bold text-emerald-500 ml-1.5">
                          ({profitMarginPercent}% margin)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-400">
                    COD Delivery: <strong className="text-gray-700">Enabled</strong><br />
                    Customer View: <strong className="text-brand-600">{formatPrice(sellNum)}</strong>
                  </div>
                </div>
              </div>

              {/* SIZES */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Available Sizes</label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {['S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'UK 6', 'UK 7', 'UK 8', 'UK 9'].map((s) => {
                    const active = sizes.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors ${
                          active
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                  <form onSubmit={addCustomSize} className="inline-flex gap-1 items-center">
                    <input
                      type="text"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="+ Custom Size"
                      className="text-xs py-1 px-2 border rounded-md w-24"
                    />
                  </form>
                </div>
              </div>

              {/* STEP 4: THE FINAL 1-CLICK PUBLISH BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handle1ClickPublish}
                  disabled={publishing || !name.trim() || !sellNum}
                  className="w-full bg-gradient-to-r from-purple-700 to-brand-600 hover:from-purple-800 hover:to-brand-700 text-white text-sm py-3.5 px-6 rounded-xl font-black shadow-lg shadow-purple-200 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Publishing to Live Website...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>🚀 1-Click Import & Publish to Store Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Immediately creates the product, attaches all images, configures sizes, and makes it live on your customer store.
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

