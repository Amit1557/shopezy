import { useState, useEffect } from 'react'
import {
  X, Sparkles, Upload, Trash2, Check, TrendingUp,
  Image as ImageIcon, DollarSign, Layers, Plus, Save
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ProductQuickEditModal({ isOpen, product, onClose, onUpdated }) {
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [meeshoLink, setMeeshoLink] = useState('')
  const [images, setImages] = useState([])
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [sizes, setSizes] = useState([])
  const [newSize, setNewSize] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [codAvailable, setCodAvailable] = useState(true)

  // Load categories
  useEffect(() => {
    if (isOpen) {
      categoriesAPI.getAll(false).then(res => setCategories(res.data || [])).catch(() => {})
    }
  }, [isOpen])

  // Populate form from product prop
  useEffect(() => {
    if (product && isOpen) {
      setName(product.name || '')
      setCategoryId(product.category_id ? String(product.category_id) : '')
      setPurchaseCost(product.purchase_cost != null ? String(product.purchase_cost) : '')
      setSellingPrice(product.selling_price != null ? String(product.selling_price) : '')
      setOriginalPrice(product.original_price != null ? String(product.original_price) : '')
      setMeeshoLink(product.meesho_link || '')
      setIsActive(product.is_active ?? true)
      setCodAvailable(product.cod_available ?? true)

      // Images: extract image URLs
      const imgs = (product.images || []).map(i => i.image_url || i)
      setImages(imgs)

      // Sizes: extract from variants or default
      const sizeVars = (product.variants || [])
        .filter(v => v.variant_type === 'size')
        .map(v => v.value)
      setSizes(sizeVars.length > 0 ? sizeVars : ['Free Size'])
    }
  }, [product, isOpen])

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
              formData.append('file', blob, `pasted-edit-${Date.now()}.png`)
              const res = await productsAdminAPI.uploadImage(formData)
              setImages(prev => [res.data.image_url, ...prev])
              toast.success('Pasted Meesho image added!')
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

  if (!isOpen || !product) return null

  // Calculation helpers
  const costNum = parseFloat(purchaseCost) || 0
  const sellNum = parseFloat(sellingPrice) || 0
  const origNum = parseFloat(originalPrice) || 0
  const profitNum = sellNum - costNum
  const profitMarginPercent = sellNum > 0 ? Math.round((profitNum / sellNum) * 100) : 0

  // Cost change handler -> auto recalculate suggested sell if sell was empty
  const handleCostChange = (val) => {
    setPurchaseCost(val)
    const cost = parseFloat(val) || 0
    if (cost > 0 && (!sellingPrice || sellNum <= cost)) {
      const suggestedSell = cost <= 250 ? cost + 200 : (cost <= 500 ? cost + 250 : Math.round(cost * 1.55))
      const roundedSell = Math.max(cost + 150, Math.round(suggestedSell / 10) * 10 - 1)
      setSellingPrice(String(roundedSell))
      setOriginalPrice(String(roundedSell + 400))
    }
  }

  // Upload file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await productsAdminAPI.uploadImage(formData)
      setImages(prev => [res.data.image_url, ...prev])
      toast.success('Photo uploaded!')
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Add URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return
    const url = imageUrlInput.trim()
    if (!images.includes(url)) {
      setImages(prev => [url, ...prev])
      setImageUrlInput('')
      toast.success('Photo URL added!')
    }
  }

  // Remove Image
  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  // Set as Main Photo (move to index 0)
  const setMainImage = (idx) => {
    if (idx === 0) return
    setImages(prev => {
      const item = prev[idx]
      const filtered = prev.filter((_, i) => i !== idx)
      return [item, ...filtered]
    })
    toast.success('Set as main showcase photo!')
  }

  // Size toggles
  const toggleSize = (sz) => {
    if (sizes.includes(sz)) {
      setSizes(sizes.filter(s => s !== sz))
    } else {
      setSizes([...sizes, sz])
    }
  }

  const handleAddCustomSize = (e) => {
    e.preventDefault()
    if (!newSize.trim()) return
    if (!sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()])
    }
    setNewSize('')
  }

  const applySizePreset = (type) => {
    if (type === 'shoes') setSizes(['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'])
    else if (type === 'clothing') setSizes(['S', 'M', 'L', 'XL', 'XXL'])
    else if (type === 'free') setSizes(['Free Size'])
  }

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Product title is required')
      return
    }
    if (!sellNum || sellNum <= 0) {
      toast.error('Valid selling price is required')
      return
    }

    setSaving(true)
    try {
      const discountPct = origNum > sellNum ? Math.round(((origNum - sellNum) / origNum) * 100) : 0
      const payload = {
        name: name.trim(),
        category_id: categoryId ? parseInt(categoryId) : null,
        purchase_cost: costNum,
        selling_price: sellNum,
        original_price: origNum > 0 ? origNum : (sellNum + 400),
        discount_percentage: discountPct,
        meesho_link: meeshoLink.trim() || null,
        is_active: isActive,
        cod_available: codAvailable,
        images: images,
        sizes: sizes.length > 0 ? sizes : ['Free Size']
      }

      await productsAdminAPI.update(product.id, payload)
      toast.success('🎉 Product details, price & photos updated successfully!')
      if (onUpdated) onUpdated()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-brand-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-black text-base">Edit Product (Price, Photos, Sizes)</h2>
              <p className="text-[11px] text-purple-100">ID #{product.id} • Updates live on your store instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
          
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-700">Product Title *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field text-xs font-semibold"
                placeholder="Product Title"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Category *</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="input-field text-xs font-bold text-purple-900"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Profit Margin Box */}
          <div className="bg-gradient-to-br from-purple-50/60 to-pink-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-600" />
                Pricing, Sourcing Cost & Profit Margin
              </label>
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Live Profit Calculator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Meesho Cost */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Meesho Cost (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={e => handleCostChange(e.target.value)}
                    placeholder="e.g. 270"
                    className="input-field pl-7 text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              {/* Selling Price */}
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
                    onChange={e => setSellingPrice(e.target.value)}
                    placeholder="e.g. 499"
                    className="input-field pl-7 text-sm font-black text-brand-700 border-brand-400 ring-2 ring-brand-100 bg-white"
                    required
                  />
                </div>
              </div>

              {/* MRP Reference */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">MRP Reference (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    placeholder="e.g. 999"
                    className="input-field pl-7 text-xs font-semibold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Live Profit Bar */}
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center justify-between text-xs shadow-sm">
              <div>
                <span className="text-gray-500 text-[11px]">Your Profit per Order:</span>
                <div className="text-base font-black text-emerald-600">
                  {profitNum > 0 ? `+${formatPrice(profitNum)}` : '₹0'}
                  {sellNum > 0 && profitNum > 0 && (
                    <span className="text-xs font-bold text-emerald-500 ml-1.5">
                      ({profitMarginPercent}% margin)
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-500">
                Customer View: <strong className="text-brand-600 font-black">{formatPrice(sellNum)}</strong><br />
                Meesho Secret Cost: <strong className="text-gray-700 font-bold">{formatPrice(costNum)}</strong>
              </div>
            </div>
          </div>

          {/* Product Photos Section */}
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                Product Photos ({images.length})
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                💡 Tip: Right-Click Meesho photo ➔ "Copy image", fir Ctrl+V dabayein!
              </span>
            </div>

            {/* Image Thumbnails Grid */}
            <div className="flex flex-wrap gap-2.5 items-center">
              {images.map((img, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-200 bg-gray-50 shrink-0 shadow-sm">
                  <img
                    src={img}
                    alt="Product"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
                    }}
                  />
                  {idx === 0 ? (
                    <span className="absolute bottom-0 inset-x-0 bg-purple-700 text-white text-[9px] font-black text-center py-0.5">
                      MAIN PHOTO
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMainImage(idx)}
                      className="absolute bottom-0 inset-x-0 bg-black/70 hover:bg-purple-700 text-white text-[8px] font-bold py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Make Main
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload & Add URL controls */}
              <div className="flex flex-wrap gap-2 items-center flex-1">
                <label className="cursor-pointer border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 text-purple-700 rounded-xl w-20 h-20 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors shrink-0">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>{uploading ? '...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <div className="flex-1 flex gap-1 min-w-[200px]">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl() } }}
                    placeholder="Paste image URL here..."
                    className="input-field text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="btn-secondary text-xs px-3 py-1 font-bold shrink-0"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sizes Section */}
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Available Sizes
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => applySizePreset('shoes')}
                  className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded font-bold"
                >
                  👟 Shoes (IND 6-10)
                </button>
                <button
                  type="button"
                  onClick={() => applySizePreset('clothing')}
                  className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded font-bold"
                >
                  👕 Clothes (S-XXL)
                </button>
                <button
                  type="button"
                  onClick={() => applySizePreset('free')}
                  className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded font-bold"
                >
                  Free Size
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map(s => {
                const active = sizes.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors ${
                      active ? 'bg-purple-700 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
              <div className="inline-flex gap-1 items-center">
                <input
                  type="text"
                  value={newSize}
                  onChange={e => setNewSize(e.target.value)}
                  placeholder="+ Custom Size"
                  className="text-xs py-1 px-2 border rounded-md w-24"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="btn-secondary text-[11px] py-1 px-2 font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Status & Options */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="font-bold text-gray-800">Active (Visible on Store)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={codAvailable}
                onChange={e => setCodAvailable(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="font-bold text-gray-800">Free Cash on Delivery (COD)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2 justify-end border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2.5 px-6 font-black flex items-center gap-1.5 shadow-md shadow-purple-200 cursor-pointer"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
              <span>Save & Update Product</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
