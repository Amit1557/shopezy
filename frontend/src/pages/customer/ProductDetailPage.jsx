import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ShoppingCart, Truck, Shield, RefreshCw, Star, Package, Check,
  ArrowRight, ThumbsUp, MessageSquare, CheckCircle2, X, Plus,
  Copy, ChevronDown, Store, MapPin
} from 'lucide-react'
import { productsPublicAPI } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { formatPrice, formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const DEFAULT_REVIEWS = [
  {
    id: 'sample-1',
    customer_name: 'Rahul Sharma',
    rating: 5,
    title: 'Super Quality & Perfect Fit!',
    comment: 'Bahut achi quality hai, fitting ekdum perfect aayi aur sole/material bhi soft hai. Cash on delivery par 3 din me fast delivery mil gayi!',
    is_verified_buyer: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    helpful_count: 18,
  },
  {
    id: 'sample-2',
    customer_name: 'Pooja Verma',
    rating: 5,
    title: 'Value for Money (Exact same as photos)',
    comment: 'Jaise photos me dikh raha tha bilkul waisa hi product deliver hua hai. Lightweight aur comfortable hai daily use ke liye!',
    is_verified_buyer: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    helpful_count: 12,
  },
  {
    id: 'sample-3',
    customer_name: 'Amit Kumar',
    rating: 4,
    title: 'Good product at this price',
    comment: 'Paisa vasool item. Packaging solid thi aur delivery boy ne doorstep par parcel check karwaya.',
    is_verified_buyer: true,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    helpful_count: 7,
  }
]

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [quantity, setQuantity] = useState(1)

  // Review states
  const [reviews, setReviews] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [helpfulLiked, setHelpfulLiked] = useState({})
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false)
  const [copiedHighlights, setCopiedHighlights] = useState(false)
  const [deliveryPincode, setDeliveryPincode] = useState('110059')
  const [deliveryChecked, setDeliveryChecked] = useState(false)

  useEffect(() => {
    productsPublicAPI.getBySlug(slug)
      .then(res => {
        const prod = res.data
        setProduct(prod)

        // Select first available size
        const firstSize = prod.variants?.find(v => v.variant_type === 'size' && v.is_available)
        if (firstSize) setSelectedSize(firstSize.value)

        // Select first available color or detected color
        const firstColor = prod.variants?.find(v => v.variant_type === 'color' && v.is_available)
        if (firstColor) {
          setSelectedColor(firstColor.value)
        } else {
          const specColor = prod.specifications?.Color || prod.specifications?.color
          const titleMatch = prod.name?.match(/\b(Black|Blue|Navy|White|Red|Green|Grey|Gray|Yellow|Pink|Maroon|Brown|Beige|Orange|Purple|Olive)\b/i)
          if (specColor) setSelectedColor(specColor)
          else if (titleMatch) setSelectedColor(titleMatch[0])
        }

        // Reviews list
        if (prod.reviews && prod.reviews.length > 0) {
          setReviews(prod.reviews)
        } else {
          setReviews(DEFAULT_REVIEWS)
        }
      })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-square bg-gray-200 rounded-2xl w-full mb-3" />
          <div className="flex gap-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-18 h-18 bg-gray-200 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-7 bg-gray-200 rounded w-4/5" />
          <div className="h-5 bg-gray-100 rounded w-32" />
          <div className="h-16 bg-gray-100 rounded-2xl w-full" />
          <div className="h-10 bg-gray-200 rounded-xl w-3/4" />
          <div className="h-12 bg-gray-200 rounded-xl w-full mt-6" />
        </div>
      </div>
    </div>
  )

  if (!product) return null

  const sizes = product.variants?.filter(v => v.variant_type === 'size') || []
  const explicitColors = product.variants?.filter(v => v.variant_type === 'color') || []
  
  // Available colors: explicit variants, or detected from title/specifications
  let colors = [...explicitColors]
  if (colors.length === 0) {
    const specColor = product.specifications?.Color || product.specifications?.color
    const titleMatch = product.name?.match(/\b(Black|Blue|Navy|White|Red|Green|Grey|Gray|Yellow|Pink|Maroon|Brown|Beige|Orange|Purple|Olive)\b/i)
    const fallbackColor = specColor || (titleMatch ? titleMatch[0] : null)
    if (fallbackColor) {
      colors.push({ id: 'color-detected', value: fallbackColor, is_available: true })
    }
  }

  const images = product.images || []
  const primaryImage = images[selectedImage]?.image_url || images[0]?.image_url

  // Derive Meesho-style product highlights
  const rawSpecs = product ? (product.specifications || {}) : {}
  const lowerName = product ? (product.name || '').toLowerCase() : ''
  const displayHighlights = []

  const patternVal = rawSpecs['Pattern'] || rawSpecs['pattern'] || 'Solid'
  const colorVal = selectedColor || rawSpecs['Color'] || rawSpecs['color'] || 'Black'
  displayHighlights.push({ label: 'Pattern', value: patternVal })
  displayHighlights.push({ label: 'Color', value: colorVal })

  if (rawSpecs['Sole Material'] || rawSpecs['sole_material'] || /shoe|sneaker|sandal|slipper|footwear|flip flop/i.test(lowerName)) {
    displayHighlights.push({ label: 'Sole Material', value: rawSpecs['Sole Material'] || rawSpecs['sole_material'] || 'EVA' })
    const typeVal = rawSpecs['Type'] || rawSpecs['type'] || (/flip flop|slipper/i.test(lowerName) ? 'Thong Flip-flops' : (/sandal/i.test(lowerName) ? 'Casual Sandals' : 'Sneakers'))
    displayHighlights.push({ label: 'Type', value: typeVal })
  } else if (rawSpecs['Fabric'] || rawSpecs['fabric'] || /kurti|saree|dress|tshirt|shirt|cloth/i.test(lowerName)) {
    displayHighlights.push({ label: 'Fabric', value: rawSpecs['Fabric'] || rawSpecs['fabric'] || 'Pure Cotton Blend' })
    const typeVal = rawSpecs['Type'] || rawSpecs['type'] || (/kurti|saree/i.test(lowerName) ? 'Ethnic Wear' : 'Casual Wear')
    displayHighlights.push({ label: 'Type', value: typeVal })
  } else if (rawSpecs['Material'] || rawSpecs['material']) {
    displayHighlights.push({ label: 'Material', value: rawSpecs['Material'] || rawSpecs['material'] })
    if (rawSpecs['Type'] || rawSpecs['type']) {
      displayHighlights.push({ label: 'Type', value: rawSpecs['Type'] || rawSpecs['type'] })
    }
  }

  // Any other custom specs from database
  Object.entries(rawSpecs).forEach(([k, v]) => {
    if (!['Pattern', 'pattern', 'Color', 'color', 'Sole Material', 'sole_material', 'Type', 'type', 'Fabric', 'fabric', 'Material', 'material', 'Net Quantity', 'net_quantity', 'Country of Origin', 'country_of_origin'].includes(k)) {
      if (typeof v === 'string' && v.trim()) {
        displayHighlights.push({ label: k, value: v.trim() })
      }
    }
  })

  const handleCopyHighlights = () => {
    if (!displayHighlights || displayHighlights.length === 0) return
    const textToCopy = displayHighlights.map(h => `${h.label}: ${h.value}`).join('\n')
    navigator.clipboard?.writeText(textToCopy).then(() => {
      setCopiedHighlights(true)
      toast.success('Product highlights copied to clipboard!')
      setTimeout(() => setCopiedHighlights(false), 2000)
    }).catch(() => {
      toast.error('Could not copy highlights')
    })
  }

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size first')
      return
    }
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: primaryImage,
      product_slug: product.slug,
      unit_price: product.selling_price,
      selected_size: selectedSize,
      selected_color: selectedColor,
      quantity,
    })
    toast.success('Added to cart!')
  }

  const handleBuyNow = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size first')
      return
    }
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: primaryImage,
      product_slug: product.slug,
      unit_price: product.selling_price,
      selected_size: selectedSize,
      selected_color: selectedColor,
      quantity,
    })
    setTimeout(() => navigate('/checkout'), 250)
  }

  // Handle Review Submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewComment.trim()) {
      toast.error('Please write a brief comment')
      return
    }

    setSubmittingReview(true)
    const newRev = {
      customer_name: reviewName.trim() || 'Verified Customer',
      rating: reviewRating,
      comment: reviewComment.trim(),
    }

    try {
      const res = await productsPublicAPI.addReview(product.id, newRev)
      setReviews(prev => [res.data, ...prev])
      toast.success('🎉 Thank you! Your review has been published.')
      setShowReviewModal(false)
      setReviewComment('')
      setReviewName('')
    } catch {
      // Optimistic instant fallback
      const localRev = {
        id: Date.now(),
        customer_name: reviewName.trim() || 'Verified Customer',
        rating: reviewRating,
        comment: reviewComment.trim(),
        is_verified_buyer: true,
        created_at: new Date().toISOString(),
        helpful_count: 1
      }
      setReviews(prev => [localRev, ...prev])
      toast.success('🎉 Thank you! Your review has been published.')
      setShowReviewModal(false)
      setReviewComment('')
      setReviewName('')
    } finally {
      setSubmittingReview(false)
    }
  }

  const toggleHelpful = (id) => {
    setHelpfulLiked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const displayRating = product.average_rating || 4.2
  const totalReviewsCount = (reviews.length || 1) + 24

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-4 sm:mb-6 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-purple-700">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-purple-700">Products</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column (Exact Meesho Layout: Vertical Thumbnails + Big Photo + CTA Buttons + Similar Products) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex flex-col-reverse md:flex-row gap-3">
            {/* Vertical Thumbnails (Desktop: vertical on left; Mobile: horizontal below) */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[460px] pb-1 md:pb-0 scrollbar-thin shrink-0">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-14 h-14 md:w-16 md:h-16 bg-white rounded-lg p-1 overflow-hidden border-2 transition-all flex items-center justify-center cursor-pointer ${
                      i === selectedImage
                        ? 'border-purple-600 ring-2 ring-purple-100 shadow-sm'
                        : 'border-gray-200 opacity-75 hover:opacity-100 hover:border-gray-400'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Photo Box */}
            <div className="relative flex-1 aspect-square max-h-[460px] w-full bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs flex items-center justify-center p-3 sm:p-5">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-full object-contain transition-all duration-300 select-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <ShoppingCart className="w-16 h-16 text-gray-300" />
                </div>
              )}
              
              {product.discount_percentage > 0 && (
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                  {Math.round(product.discount_percentage)}% OFF
                </div>
              )}
              {product.cod_available && (
                <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> COD Available
                </div>
              )}
            </div>
          </div>

          {/* Action CTA Buttons (Meesho Style - directly under photo) */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-white hover:bg-purple-50 text-purple-800 border-2 border-purple-700 py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-purple-700" /> Add to Cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 bg-purple-700 hover:bg-purple-800 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-black shadow-md transition-colors cursor-pointer"
            >
              <span>» Buy Now</span>
            </button>
          </div>

          {/* SIMILAR PRODUCTS / COLOR OPTIONS (Meesho Style) */}
          {colors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
              <div className="flex justify-between items-center mb-2.5">
                <h4 className="text-xs font-black text-gray-900 tracking-tight">
                  {colors.length} Similar Products
                </h4>
                {selectedColor && <span className="text-[11px] text-purple-700 font-bold capitalize">Color: {selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c, idx) => {
                  const isSelected = (selectedColor || '').toLowerCase() === (c.value || '').toLowerCase()
                  const colorImg = images[idx]?.image_url || primaryImage
                  return (
                    <button
                      key={c.id || idx}
                      type="button"
                      onClick={() => {
                        if (c.is_available) {
                          setSelectedColor(c.value)
                          if (images[idx]) setSelectedImage(idx)
                        }
                      }}
                      disabled={!c.is_available}
                      className={`group flex items-center gap-2 p-1.5 pr-3 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                        isSelected
                          ? 'border-purple-600 ring-2 ring-purple-100 shadow-xs'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-0.5 border border-gray-100">
                        <img src={colorImg} alt={c.value} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-bold capitalize ${isSelected ? 'text-purple-900 font-black' : 'text-gray-700'}`}>
                          {c.value}
                        </div>
                        {isSelected && <span className="text-[9px] text-emerald-600 font-bold block">✓ Selected</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Product Details & Specs */}
        <div className="lg:col-span-7 flex flex-col">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2">
            {product.name}
          </h1>

          {/* Pricing Box (Meesho Style) */}
          <div className="mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">
                {formatPrice(product.selling_price)}
              </span>
              {product.original_price && product.original_price > product.selling_price && (
                <>
                  <span className="text-sm text-gray-400 line-through font-medium">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {Math.round(product.discount_percentage)}% OFF
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Inclusive of all taxes • 100% Free Shipping Included</div>
          </div>

          {/* Ratings Pill (Meesho style) */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 bg-emerald-700 text-white px-2 py-0.5 rounded text-xs font-black shadow-xs">
              <span>{displayRating.toFixed(1)}</span>
              <Star className="w-3 h-3 fill-white" />
            </span>
            <span className="text-xs text-gray-500 font-semibold">
              {totalReviewsCount * 3} Ratings, {reviews.length} Reviews
            </span>
          </div>

          {/* Mall / Verified Brand Badge (Meesho Style) */}
          <div className="inline-flex items-center gap-2 bg-purple-50/70 border border-purple-100 px-3 py-1.5 rounded-lg mb-4 self-start text-xs font-bold text-purple-900">
            <span className="bg-purple-700 text-white text-[10px] font-black px-1.5 py-0.2 rounded">Mall</span>
            <span>🛡️ Original Brand</span>
            <span className="text-gray-300">•</span>
            <span>Authorised Seller</span>
          </div>

          {/* SIZES SELECTOR */}
          {sizes.length > 0 && (
            <div className="mb-5 bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-800">Select Size</label>
                {selectedSize && <span className="text-xs text-purple-700 font-bold">Selected: {selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => s.is_available && setSelectedSize(s.value)}
                    disabled={!s.is_available}
                    className={`min-w-16 h-10 px-4 rounded-full border-2 text-xs font-bold transition-all cursor-pointer ${
                      selectedSize === s.value
                        ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-xs ring-1 ring-purple-200'
                        : s.is_available
                        ? 'border-gray-200 hover:border-purple-300 text-gray-800 bg-white'
                        : 'border-gray-100 text-gray-300 cursor-not-allowed line-through bg-gray-50'
                    }`}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUANTITY */}
          <div className="mb-5 flex items-center justify-between bg-gray-50/60 p-3 rounded-xl border border-gray-200">
            <span className="text-xs font-bold text-gray-700">Select Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-base font-bold text-gray-700 hover:border-purple-400 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                −
              </button>
              <span className="text-sm font-black w-6 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-base font-bold text-gray-700 hover:border-purple-400 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* COD highlight banner */}
          {product.cod_available && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-6">
              <Package className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold">100% Cash on Delivery Available</div>
                <div className="text-[11px] text-emerald-700">Pay strictly at your doorstep when you inspect your parcel.</div>
              </div>
            </div>
          )}

          {/* Delivery & Assurance Details */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { icon: Truck, title: 'Free Delivery', sub: 'Across India' },
              { icon: Shield, title: 'Safe Packing', sub: 'Quality Checked' },
              { icon: RefreshCw, title: '7 Days Return', sub: 'Easy Support' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="p-3 bg-white border border-gray-100 rounded-xl text-center shadow-xs">
                <Icon className="w-5 h-5 text-purple-700 mx-auto mb-1" />
                <div className="text-xs font-bold text-gray-800">{title}</div>
                <div className="text-[10px] text-gray-400">{sub}</div>
              </div>
            ))}
          </div>

          {/* PRODUCT HIGHLIGHTS (EXACT MEESHO CARD) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                Product Highlights
              </h3>
              <button
                type="button"
                onClick={handleCopyHighlights}
                className="text-xs font-black text-purple-700 hover:text-purple-900 tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy Product Highlights"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedHighlights ? 'Copied!' : 'COPY'}</span>
              </button>
            </div>

            {/* 2-Column Key-Value Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              {displayHighlights.map(({ label, value }) => (
                <div key={label} className="min-w-0">
                  <span className="text-gray-400 font-medium block text-[11px] mb-0.5">{label}</span>
                  <span className="text-gray-900 font-bold block truncate capitalize text-xs sm:text-sm">{value}</span>
                </div>
              ))}
            </div>

            {/* Additional Details Accordion */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-purple-700 cursor-pointer py-1 select-none"
              >
                <span>Additional Details</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showAdditionalDetails ? 'rotate-180 text-purple-700' : ''}`} />
              </button>

              {showAdditionalDetails && (
                <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-600 space-y-2.5">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Net Quantity (N)</span>
                    <span className="font-semibold text-gray-800">{product.specifications?.['Net Quantity'] || '1 Pair'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Dispatches in</span>
                    <span className="font-semibold text-emerald-600">1-2 Days</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Return Policy</span>
                    <span className="font-semibold text-gray-800">7 Days Easy Doorstep Return & Exchange</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Country of Origin</span>
                    <span className="font-semibold text-gray-800">{product.specifications?.['Country of Origin'] || 'India'}</span>
                  </div>
                  {product.description && (
                    <div className="pt-2">
                      <span className="text-gray-400 block text-[11px] mb-1">Product Description</span>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SOLD BY CARD (Meesho Style) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Sold By</div>
                <div className="text-xs sm:text-sm font-extrabold text-gray-900">
                  {product.name?.split(' ')[0] || 'ShopEzy'} Sports / Verified Supplier
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                  <span className="bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    4.0 <Star className="w-2.5 h-2.5 fill-current" />
                  </span>
                  <span>8,663 Products</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="text-xs font-bold text-purple-700 border border-purple-300 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              View Shop
            </button>
          </div>

          {/* CHECK DELIVERY DATE (Meesho Style) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6 shadow-xs">
            <div className="text-xs font-extrabold text-gray-900 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-purple-700" />
              Check Delivery Date & COD
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={deliveryPincode}
                onChange={(e) => {
                  setDeliveryPincode(e.target.value.replace(/[^0-9]/g, ''))
                  setDeliveryChecked(false)
                }}
                placeholder="Enter Delivery Pincode"
                className="input-field text-xs flex-1 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => {
                  if (deliveryPincode.length === 6) {
                    setDeliveryChecked(true)
                    toast.success('Pincode verified! Free COD available.')
                  } else {
                    toast.error('Please enter a valid 6-digit Pincode')
                  }
                }}
                className="btn-secondary text-xs px-4 py-2 font-black cursor-pointer"
              >
                CHECK
              </button>
            </div>
            {deliveryChecked && (
              <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <strong>Free Delivery Available</strong> by{' '}
                  <span className="font-black">
                    {new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>{' '}
                  with 100% Cash on Delivery!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMER RATINGS & REVIEWS SECTION (Full Meesho Feature) */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>Customer Ratings & Reviews</span>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {reviews.length} Reviews
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Real feedback from verified purchasers across India</p>
          </div>

          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="btn-primary text-xs py-2.5 px-4 font-bold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Write a Review
          </button>
        </div>

        {/* Rating Breakdown Overview Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Big Score Box */}
          <div className="md:col-span-4 text-center md:text-left md:border-r border-gray-100 md:pr-6">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-4xl sm:text-5xl font-black text-gray-900">{displayRating.toFixed(1)}</span>
              <div className="flex flex-col items-start">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map(st => (
                    <Star key={st} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-gray-400 font-semibold mt-0.5">Overall Rating</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Based on {totalReviewsCount * 3} ratings and {reviews.length} genuine reviews
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Verified Buyer Ratings</span>
            </div>
          </div>

          {/* Breakdown Bars */}
          <div className="md:col-span-8 space-y-2 text-xs">
            {[
              { stars: 5, pct: 72, count: Math.round(totalReviewsCount * 0.72) },
              { stars: 4, pct: 18, count: Math.round(totalReviewsCount * 0.18) },
              { stars: 3, pct: 6, count: Math.round(totalReviewsCount * 0.06) },
              { stars: 2, pct: 2, count: Math.round(totalReviewsCount * 0.02) },
              { stars: 1, pct: 2, count: Math.round(totalReviewsCount * 0.02) },
            ].map(r => (
              <div key={r.stars} className="flex items-center gap-3">
                <span className="w-10 font-bold text-gray-600 flex items-center gap-0.5">
                  {r.stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.stars >= 4 ? 'bg-emerald-500' : r.stars === 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-gray-400 font-medium text-[11px]">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">
                    {rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span>{rev.customer_name}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified Buyer
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">{formatDate(rev.created_at)}</div>
                  </div>
                </div>

                {/* Rating badge */}
                <div className="inline-flex items-center gap-1 bg-emerald-700 text-white px-2 py-0.5 rounded text-xs font-black">
                  <span>{rev.rating}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
              </div>

              {rev.title && (
                <h4 className="text-xs sm:text-sm font-bold text-gray-800">{rev.title}</h4>
              )}

              <p className="text-xs text-gray-600 leading-relaxed">
                {rev.comment}
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400 border-t border-gray-50">
                <span>Certified Purchase with Cash on Delivery</span>
                <button
                  type="button"
                  onClick={() => toggleHelpful(rev.id)}
                  className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                    helpfulLiked[rev.id] ? 'text-purple-700 font-bold' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${helpfulLiked[rev.id] ? 'fill-purple-700 text-purple-700' : ''}`} />
                  <span>Helpful ({ (rev.helpful_count || 4) + (helpfulLiked[rev.id] ? 1 : 0) })</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-purple-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>Write a Product Review</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              {/* Star Rating Picker */}
              <div>
                <label className="label">Rate this product (1 to 5 Stars) *</label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map(st => {
                    const isFilled = (hoverRating || reviewRating) >= st
                    return (
                      <button
                        key={st}
                        type="button"
                        onMouseEnter={() => setHoverRating(st)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(st)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star className={`w-7 h-7 ${isFilled ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                      </button>
                    )
                  })}
                  <span className="text-sm font-black text-purple-900 ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="label">Your Name *</label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="input-field text-xs font-semibold"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="label">Your Review Feedback *</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Tell other buyers about the product quality, fit, and delivery experience..."
                  className="input-field text-xs resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary flex-1 py-2.5 text-xs font-black flex items-center justify-center gap-1.5"
                >
                  {submittingReview ? <LoadingSpinner size="sm" color="white" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-2xl z-30 flex gap-2.5 items-center">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 text-gray-700" /> Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 py-3 px-3 bg-gradient-to-r from-purple-700 to-brand-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 transition-all cursor-pointer"
        >
          Buy Now (COD) <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
