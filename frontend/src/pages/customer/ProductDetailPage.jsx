import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Truck, Shield, RefreshCw, Star, Package, Check, ArrowRight } from 'lucide-react'
import { productsPublicAPI } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    productsPublicAPI.getBySlug(slug)
      .then(res => {
        setProduct(res.data)
        const firstSize = res.data.variants?.find(v => v.variant_type === 'size' && v.is_available)
        const firstColor = res.data.variants?.find(v => v.variant_type === 'color' && v.is_available)
        if (firstSize) setSelectedSize(firstSize.value)
        if (firstColor) setSelectedColor(firstColor.value)
      })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
  if (!product) return null

  const sizes = product.variants?.filter(v => v.variant_type === 'size') || []
  const colors = product.variants?.filter(v => v.variant_type === 'color') || []
  const images = product.images || []
  const primaryImage = images[selectedImage]?.image_url || images[0]?.image_url

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size')
      return
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error('Please select a color')
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
    handleAddToCart()
    setTimeout(() => navigate('/checkout'), 300)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-600">Products</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-3 border border-gray-100 shadow-sm">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <ShoppingCart className="w-16 h-16 text-gray-300" />
              </div>
            )}
            {product.discount_percentage > 0 && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {Math.round(product.discount_percentage)}% OFF
              </div>
            )}
            {product.cod_available && (
              <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Check className="w-3 h-3" /> COD Available
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-brand-600 shadow-md scale-105' : 'border-transparent opacity-75 hover:opacity-100'}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug mb-3">
            {product.name}
          </h1>

          {/* Ratings */}
          {product.average_rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-0.5 rounded-md text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-white" /> {product.average_rating.toFixed(1)}
              </div>
              <span className="text-xs text-gray-500">Verified Customer Rating</span>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-brand-50/50 p-4 rounded-2xl mb-6 border border-brand-100">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900">
                {formatPrice(product.selling_price)}
              </span>
              {product.original_price && product.original_price > product.selling_price && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    Save {Math.round(product.discount_percentage)}%
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">Inclusive of all taxes • Free Shipping included</div>
          </div>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Select Size</label>
                {selectedSize && <span className="text-xs text-brand-600 font-semibold">Selected: {selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => s.is_available && setSelectedSize(s.value)}
                    disabled={!s.is_available}
                    className={`min-w-12 h-10 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      selectedSize === s.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : s.is_available
                        ? 'border-gray-200 hover:border-brand-300 text-gray-700 bg-white'
                        : 'border-gray-100 text-gray-300 cursor-not-allowed line-through bg-gray-50'
                    }`}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Select Color</label>
                {selectedColor && <span className="text-xs text-brand-600 font-semibold">Selected: {selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {colors.map(c => (
                  <button
                    key={c.id}
                    onClick={() => c.is_available && setSelectedColor(c.value)}
                    disabled={!c.is_available}
                    className={`px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                      selectedColor === c.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : c.is_available
                        ? 'border-gray-200 hover:border-brand-300 text-gray-700 bg-white'
                        : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    {c.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-base font-bold text-gray-700 hover:border-brand-400 active:scale-95 transition-all shadow-sm"
              >
                −
              </button>
              <span className="text-base font-bold w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-base font-bold text-gray-700 hover:border-brand-400 active:scale-95 transition-all shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3.5 text-sm"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5 text-sm shadow-brand"
            >
              Buy Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* COD highlight banner */}
          {product.cod_available && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-6">
              <Package className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold">Cash on Delivery Available</div>
                <div className="text-[11px] text-emerald-600">Pay strictly at your doorstep when you receive your package.</div>
              </div>
            </div>
          )}

          {/* Delivery & Assurance Details */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { icon: Truck, title: 'Free Delivery', sub: 'Across India' },
              { icon: Shield, title: 'Safe Packing', sub: 'Sanitized' },
              { icon: RefreshCw, title: '7 Days Return', sub: 'Guaranteed' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="p-3 bg-white border border-gray-100 rounded-xl text-center shadow-sm">
                <Icon className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                <div className="text-xs font-bold text-gray-800">{title}</div>
                <div className="text-[10px] text-gray-400">{sub}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Product Description</h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-gray-100">
                {product.description}
              </p>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Specifications</h3>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden text-xs">
                {Object.entries(product.specifications).map(([k, v], idx) => (
                  <div key={k} className={`flex py-2.5 px-3.5 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <span className="text-gray-500 w-1/3 font-medium">{k}</span>
                    <span className="text-gray-800 w-2/3 font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar (App-like feel for phones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-2xl z-30 flex gap-2.5 items-center">
        <button
          onClick={handleAddToCart}
          className="flex-1 py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 text-gray-700" /> Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 py-3 px-3 bg-gradient-to-r from-purple-700 to-brand-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 transition-all cursor-pointer"
        >
          Buy Now (COD) <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

