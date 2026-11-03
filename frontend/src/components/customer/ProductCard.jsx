import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Check } from 'lucide-react'
import { formatPrice } from '../../utils/helpers'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const primaryImage = product.images?.find(i => i.is_primary)?.image_url || product.images?.[0]?.image_url

  const handleQuickAdd = (e) => {
    e.preventDefault()
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

  const rating = product.average_rating || 4.1
  const reviewCount = product.total_reviews || (product.id * 17 + 23)

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group flex flex-col"
    >
      {/* Product Image */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

        {/* Free Delivery / COD badge */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>Free COD</span>
        </div>
      </div>

      {/* Product Information - Meesho Style */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs text-gray-700 font-semibold line-clamp-1 leading-snug hover:text-pink-600 transition-colors">
            {product.name}
          </h3>

          {/* Pricing Row: Price, Strikethrough, Discount % */}
          <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
            <span className="text-base font-black text-gray-900">
              {formatPrice(product.selling_price)}
            </span>
            {product.original_price && product.original_price > product.selling_price && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
                {discount > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600">
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          {/* Rating Pill - Meesho Green Style */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
              <span>{rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 fill-white" />
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {reviewCount} Reviews
            </span>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className="mt-3 w-full py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-1"
        >
          <ShoppingCart className="w-3 h-3" />
          <span>Add to Cart</span>
        </button>
      </div>
    </Link>
  )
}
