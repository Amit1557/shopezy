import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Image as ImageIcon, Star,
  DollarSign, Package, Check, AlertCircle, ExternalLink, Sparkles
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice, calcDiscount } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  // Quick Meesho Importer State
  const [meeshoRawText, setMeeshoRawText] = useState('')
  const [meeshoCostInput, setMeeshoCostInput] = useState('')
  const [importingMeesho, setImportingMeesho] = useState(false)

  // Product Core Form
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [meeshoLink, setMeeshoLink] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [codAvailable, setCodAvailable] = useState(true)
  const [stockQuantity, setStockQuantity] = useState('100')

  // Images state
  const [images, setImages] = useState([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await productsAdminAPI.uploadImage(formData)
      const uploadedUrl = res.data.image_url
      setImages(prev => [...prev, { image_url: uploadedUrl, is_primary: prev.length === 0 }])
      toast.success('Image uploaded successfully from device!')
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // Clipboard paste listener for images (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            e.preventDefault()
            setUploadingImage(true)
            try {
              const formData = new FormData()
              formData.append('file', blob, `pasted-image-${Date.now()}.png`)
              const res = await productsAdminAPI.uploadImage(formData)
              setImages(prev => [...prev, { image_url: res.data.image_url, is_primary: prev.length === 0 }])
              toast.success('Pasted image attached successfully!')
            } catch {
              toast.error('Failed to attach pasted image')
            } finally {
              setUploadingImage(false)
            }
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  // Variants state
  const [sizeInput, setSizeInput] = useState('')
  const [sizes, setSizes] = useState(['S', 'M', 'L', 'XL'])
  const [colorInput, setColorInput] = useState('')
  const [colors, setColors] = useState([])

  // Specifications
  const [specList, setSpecList] = useState([
    { key: 'Fabric', val: '' },
    { key: 'Fit', val: '' },
  ])

  useEffect(() => {
    categoriesAPI.getAll(false).then(res => setCategories(res.data || [])).catch(() => {})

    if (isEdit) {
      productsAdminAPI.getById(id)
        .then(res => {
          const p = res.data
          setName(p.name || '')
          setCategoryId(p.category_id || '')
          setDescription(p.description || '')
          setPurchaseCost(p.purchase_cost ?? '')
          setSellingPrice(p.selling_price ?? '')
          setOriginalPrice(p.original_price ?? '')
          setMeeshoLink(p.meesho_link || '')
          setIsActive(p.is_active ?? true)
          setIsFeatured(p.is_featured ?? false)
          setCodAvailable(p.cod_available ?? true)
          setStockQuantity(String(p.stock_quantity ?? 100))
          setImages(p.images || [])

          // Parse variants
          const s = (p.variants || []).filter(v => v.variant_type === 'size').map(v => v.value)
          const c = (p.variants || []).filter(v => v.variant_type === 'color').map(v => v.value)
          setSizes(s)
          setColors(c)

          // Parse specs
          if (p.specifications && typeof p.specifications === 'object') {
            const list = Object.entries(p.specifications).map(([k, v]) => ({ key: k, val: String(v) }))
            if (list.length > 0) setSpecList(list)
          }
        })
        .catch(() => {
          toast.error('Failed to load product')
          navigate('/admin/products')
        })
        .finally(() => setFetchLoading(false))
    }
  }, [id])

  // Quick Parse from Meesho Handler
  const handleParseMeesho = async (e) => {
    e.preventDefault()
    if (!meeshoRawText.trim()) {
      toast.error('Please paste a Meesho product link or copied description')
      return
    }
    setImportingMeesho(true)
    try {
      const res = await productsAdminAPI.parseMeesho({
        raw_text: meeshoRawText.trim(),
        meesho_cost: meeshoCostInput ? parseFloat(meeshoCostInput) : undefined
      })
      const data = res.data

      if (data.name) setName(data.name)
      if (data.description) setDescription(data.description)
      if (data.purchase_cost) setPurchaseCost(String(data.purchase_cost))
      if (data.selling_price) setSellingPrice(String(data.selling_price))
      if (data.original_price) setOriginalPrice(String(data.original_price))
      if (data.meesho_link) setMeeshoLink(data.meesho_link)
      if (data.sizes && data.sizes.length > 0) setSizes(data.sizes)
      if (data.colors && data.colors.length > 0) setColors(data.colors)

      // Auto-select category matching Meesho
      if (data.category_slug && categories.length > 0) {
        const match = categories.find(c => c.slug === data.category_slug) || categories.find(c => c.slug.includes(data.category_slug))
        if (match) setCategoryId(String(match.id))
      }
      if (data.images && data.images.length > 0) {
        setImages(prev => [
          ...prev,
          ...data.images.map((url, idx) => ({ image_url: url, is_primary: prev.length === 0 && idx === 0 }))
        ])
      }

      // Auto-match category
      if (data.category_slug && categories.length > 0) {
        const matched = categories.find(c => c.slug === data.category_slug)
        if (matched) setCategoryId(String(matched.id))
      }

      // Auto-match specs
      if (data.specifications && Object.keys(data.specifications).length > 0) {
        const specArr = Object.entries(data.specifications).map(([k, v]) => ({ key: k, val: String(v) }))
        setSpecList(specArr)
      }

      toast.success('Form auto-filled from Meesho! Now attach product photo & verify pricing.')
    } catch {
      toast.error('Could not auto-parse Meesho input. Please review your input.')
    } finally {
      setImportingMeesho(false)
    }
  }

  // Calculated margin
  const sellNum = parseFloat(sellingPrice) || 0
  const costNum = parseFloat(purchaseCost) || 0
  const origNum = parseFloat(originalPrice) || 0
  const marginAmt = sellNum - costNum
  const marginPct = sellNum > 0 ? Math.round((marginAmt / sellNum) * 100) : 0
  const discountPct = calcDiscount(origNum, sellNum)

  // Image helpers
  const handleAddImage = (e) => {
    e.preventDefault()
    if (!newImageUrl.trim()) return
    setImages(prev => [...prev, { image_url: newImageUrl.trim(), is_primary: prev.length === 0 }])
    setNewImageUrl('')
  }

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSetPrimary = (idx) => {
    setImages(prev => prev.map((img, i) => ({ ...img, is_primary: i === idx })))
  }

  // Variant helpers
  const handleAddSize = (e) => {
    e.preventDefault()
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
      setSizes(s => [...s, sizeInput.trim()])
      setSizeInput('')
    }
  }

  const handleAddColor = (e) => {
    e.preventDefault()
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors(c => [...c, colorInput.trim()])
      setColorInput('')
    }
  }

  // Spec helpers
  const addSpecRow = () => setSpecList(prev => [...prev, { key: '', val: '' }])
  const removeSpecRow = (idx) => setSpecList(prev => prev.filter((_, i) => i !== idx))
  const updateSpecRow = (idx, field, val) => {
    setSpecList(prev => {
      const copy = [...prev]
      copy[idx][field] = val
      return copy
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Product title is required'); return }
    if (!sellingPrice || sellNum <= 0) { toast.error('Valid selling price is required'); return }

    setLoading(true)
    try {
      // Build specs dictionary
      const specsObj = {}
      specList.forEach(sp => {
        if (sp.key.trim() && sp.val.trim()) specsObj[sp.key.trim()] = sp.val.trim()
      })

      // Build variants payload
      const variantsPayload = [
        ...sizes.map(s => ({ variant_type: 'size', value: s, is_available: true })),
        ...colors.map(c => ({ variant_type: 'color', value: c, is_available: true }))
      ]

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId ? parseInt(categoryId) : null,
        purchase_cost: costNum,
        selling_price: sellNum,
        original_price: origNum > 0 ? origNum : null,
        discount_percentage: discountPct,
        meesho_link: meeshoLink.trim() || null,
        is_active: isActive,
        is_featured: isFeatured,
        cod_available: codAvailable,
        stock_quantity: parseInt(stockQuantity) || 100,
        specifications: specsObj,
        variants: variantsPayload,
        images: images.map(img => typeof img === 'string' ? img : (img.image_url || '')).filter(Boolean),
        sizes: sizes
      }

      if (isEdit) {
        await productsAdminAPI.update(id, payload)
        await productsAdminAPI.updateVariants(id, variantsPayload)
        toast.success('Product updated successfully!')
      } else {
        const res = await productsAdminAPI.create(payload)
        const newProdId = res.data.id

        // Upload any attached images
        for (const img of images) {
          await productsAdminAPI.addImage(newProdId, img.image_url, img.is_primary)
        }
        toast.success('Product created successfully!')
      }

      navigate('/admin/products')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save product'
      toast.error(typeof msg === 'string' ? msg : 'Error saving product')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) return (
    <div className="flex justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/products"
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">
            {isEdit ? 'Edit Sourced Product' : 'Add New Product from Meesho'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Set customer-facing selling price, description & internal supplier cost
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Meesho Link Importer Card */}
        {!isEdit && (
          <div className="card p-5 border-2 border-purple-400 bg-gradient-to-r from-purple-50/80 via-brand-50/40 to-pink-50/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">
                    Fast Track: Quick Auto-Fill from Meesho Link
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Meesho product link paste karein aur form 2 second mein automatically bhar jayega!
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
                ⚡ Time Saver
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
              <div className="sm:col-span-7">
                <input
                  type="text"
                  value={meeshoRawText}
                  onChange={e => setMeeshoRawText(e.target.value)}
                  placeholder="Paste Meesho Link (https://meesho.com/...) or copied share text..."
                  className="input-field text-xs font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="0.01"
                  value={meeshoCostInput}
                  onChange={e => setMeeshoCostInput(e.target.value)}
                  placeholder="Meesho Price (₹)"
                  className="input-field text-xs font-bold"
                  title="Meesho par jo price dikh raha hai"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleParseMeesho}
                  disabled={importingMeesho}
                  className="w-full btn-primary text-xs py-2.5 px-3 font-bold flex items-center justify-center gap-1.5 shadow-brand"
                >
                  {importingMeesho ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Form
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="card p-5 space-y-4">
          <h2 className="font-extrabold text-gray-900 text-sm">Product Information</h2>

          <div>
            <label className="label">Product Name / Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Women Floral Print Anarkali Kurta Set"
              className="input-field text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="input-field text-xs font-medium"
              >
                <option value="">-- Choose Category --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Stock Quantity Available</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={e => setStockQuantity(e.target.value)}
                placeholder="100"
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed product highlights, material feel, size notes, and styling recommendations..."
              className="input-field text-xs"
            />
          </div>
        </div>

        {/* Meesho Sourcing & Pricing Card */}
        <div className="card p-5 border-2 border-purple-200 bg-purple-50/20 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" /> Sourcing Cost & Selling Price
            </h2>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              Reselling Economics
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">
                Meesho Purchase Cost (₹)
                <span className="text-[10px] text-gray-400 block font-normal">(Internal only – never shown to customer)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={purchaseCost}
                onChange={e => setPurchaseCost(e.target.value)}
                placeholder="e.g. 320"
                className="input-field text-xs font-bold text-gray-700"
              />
            </div>

            <div>
              <label className="label">
                Store Selling Price (₹) <span className="text-red-500">*</span>
                <span className="text-[10px] text-gray-400 block font-normal">(What customer pays on COD)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                placeholder="e.g. 599"
                className="input-field text-xs font-black text-gray-900"
                required
              />
            </div>

            <div>
              <label className="label">
                MRP / Strike-off Price (₹)
                <span className="text-[10px] text-gray-400 block font-normal">(Shown as original price)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value)}
                placeholder="e.g. 1199"
                className="input-field text-xs text-gray-500"
              />
            </div>
          </div>

          {/* Sourcing reference link */}
          <div>
            <label className="label">
              Meesho Source Product Link (Optional)
              <span className="text-[10px] text-gray-400 block font-normal">Saves the Meesho link so you can quickly find it when fulfilling orders</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={meeshoLink}
                onChange={e => setMeeshoLink(e.target.value)}
                placeholder="https://meesho.com/s/p/..."
                className="input-field text-xs"
              />
              {meeshoLink && (
                <a
                  href={meeshoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Dynamic Margin Calculator Result */}
          {sellNum > 0 && (
            <div className="p-4 bg-white rounded-xl border border-purple-200 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Customer Discount</span>
                <span className="font-extrabold text-red-600 text-sm">{discountPct}% OFF</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Estimated Profit Margin</span>
                <span className="font-extrabold text-emerald-700 text-sm">+{formatPrice(marginAmt)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Profit Percentage</span>
                <span className="font-extrabold text-brand-700 text-sm">{marginPct}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Product Images */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-600" /> Product Images
            </h2>
            <span className="text-[11px] text-gray-400">Upload file or paste image link</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            {/* Upload from Computer/Phone */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Option 1: Upload from Device (Phone/PC)
              </label>
              <label className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-2 cursor-pointer w-full text-center">
                {uploadingImage ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose Image File (.jpg, .png, .webp)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Paste Image URL */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Option 2: Or Paste Online Image URL
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="input-field text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="btn-outline text-xs px-3 font-bold flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {images.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No images added yet. Add at least one image URL.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className={`p-1.5 rounded-lg text-xs font-bold ${img.is_primary ? 'bg-yellow-400 text-black' : 'bg-white/80 hover:bg-white text-gray-700'}`}
                      title={img.is_primary ? 'Primary cover image' : 'Set as primary'}
                    >
                      <Star className={`w-3.5 h-3.5 ${img.is_primary ? 'fill-black' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {img.is_primary && (
                    <span className="absolute bottom-2 left-2 bg-yellow-400 text-black font-extrabold text-[9px] px-2 py-0.5 rounded shadow">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants (Sizes & Colors) */}
        <div className="card p-5 space-y-4">
          <h2 className="font-extrabold text-gray-900 text-sm">Product Variants</h2>

          {/* Sizes */}
          <div>
            <label className="label">Available Sizes</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                placeholder="e.g. M, L, XL, Free Size"
                className="input-field text-xs w-48"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="btn-outline text-xs px-3 font-semibold"
              >
                + Add Size
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map(s => (
                <span key={s} className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {s}
                  <button type="button" onClick={() => setSizes(sizes.filter(x => x !== s))} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="label">Available Colors</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={colorInput}
                onChange={e => setColorInput(e.target.value)}
                placeholder="e.g. Black, Navy Blue, Red"
                className="input-field text-xs w-48"
              />
              <button
                type="button"
                onClick={handleAddColor}
                className="btn-outline text-xs px-3 font-semibold"
              >
                + Add Color
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {colors.map(c => (
                <span key={c} className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {c}
                  <button type="button" onClick={() => setColors(colors.filter(x => x !== c))} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-gray-900 text-sm">Specifications (Key-Value)</h2>
            <button
              type="button"
              onClick={addSpecRow}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              + Add Specification Row
            </button>
          </div>

          <div className="space-y-2">
            {specList.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={row.key}
                  onChange={e => updateSpecRow(idx, 'key', e.target.value)}
                  placeholder="Feature (e.g. Fabric)"
                  className="input-field text-xs w-1/3"
                />
                <input
                  type="text"
                  value={row.val}
                  onChange={e => updateSpecRow(idx, 'val', e.target.value)}
                  placeholder="Detail (e.g. 100% Cotton)"
                  className="input-field text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeSpecRow(idx)}
                  className="text-gray-400 hover:text-red-500 p-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Visibility & Badges */}
        <div className="card p-5 space-y-3">
          <h2 className="font-extrabold text-gray-900 text-sm">Visibility & Flags</h2>
          <div className="flex flex-wrap gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span className="font-bold text-gray-800">Product Active (Visible in store)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span className="font-bold text-gray-800">Featured Showcase (Shows on Homepage)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={codAvailable}
                onChange={e => setCodAvailable(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span className="font-bold text-gray-800">Cash on Delivery Enabled</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-3 text-xs font-black shadow-brand flex items-center justify-center gap-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>{isEdit ? 'Save Changes' : 'Publish Product to Store'}</>
            )}
          </button>
          <Link to="/admin/products" className="btn-outline text-xs px-6 py-3 font-bold">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

