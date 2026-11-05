import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Check, Flame, Zap } from 'lucide-react'
import { formatPrice } from '../../utils/helpers'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const primaryImage = product.images?.find(i => i.is_primary)?.image_url || product.images?.[0]?.image_url

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: primaryImage,
      product_slug: product.slug,
      unit_price: product.selling_price,
      selected_size: product.variants?.[0]?.size || null,
      selected_color: null,
      quantity: 1,
    })
    toast.success('Added to cart!')
  }

  // Calculate discount percentage if not provided
  const discount = product.discount_percentage || (
    product.original_price && product.original_price > product.selling_price
      ? Math.round(((product.original_price - product.selling_price) / product.original_price) * 100)
      : 0
  )

  const rating = product.average_rating || 4.2
  const reviewCount = product.total_reviews || (product.id * 19 + 27)

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-purple-50">
            <ShoppingCart className="w-12 h-12 text-purple-200" />
          </div>
        )}

        {/* Top Badges (Hot Deal / Trending) */}
        {(product.is_featured || discount >= 35) && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
            <Flame className="w-2.5 h-2.5 fill-white" />
            <span>{product.is_featured ? 'Trending' : 'Special Offer'}</span>
          </div>
        )}

        {/* Free Delivery & Cash on Delivery Badge */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs border border-emerald-100 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
          <span>Free COD</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          {/* Title - 2 lines for clean, readable catalog layout */}
          <h3 className="text-xs sm:text-[13px] text-gray-800 font-bold line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors min-h-[2.4rem]">
            {product.name}
          </h3>

          {/* Pricing Row: Bold Price, Strikethrough, Discount Pill */}
          <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
            <span className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              {formatPrice(product.selling_price)}
            </span>
            {product.original_price && product.original_price > product.selling_price && (
              <>
                <span className="text-[11px] sm:text-xs text-gray-400 line-through font-medium">
                  {formatPrice(product.original_price)}
                </span>
                {discount > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-100/80">
                    {discount}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {/* Trust & Rating Bar */}
          <div className="flex items-center justify-between text-[10px] pt-0.5">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">
                <span>{rating.toFixed(1)}</span>
                <Star className="w-2.5 h-2.5 fill-white" />
              </span>
              <span className="text-gray-400 font-medium">
                ({reviewCount})
              </span>
            </div>
            <span className="text-gray-500 font-semibold text-[10px]">
              Free Delivery
            </span>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          className="w-full mt-2 py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-purple-700 to-brand-700 hover:from-purple-800 hover:to-brand-800 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </Link>
  )
}
