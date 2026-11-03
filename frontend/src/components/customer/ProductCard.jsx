import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
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
      selected_size: null,
      selected_color: null,
      quantity: 1,
    })
    toast.success('Added to cart!')
  }

  return (
    <Link to={`/product/${product.slug}`} className="product-card group block">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-pink-50">
            <ShoppingCart className="w-12 h-12 text-brand-200" />
          </div>
        )}
        {product.discount_percentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {Math.round(product.discount_percentage)}% OFF
          </div>
        )}
        {product.cod_available && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            COD ✓
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-gray-700 font-medium line-clamp-2 leading-snug mb-1">{product.name}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-bold text-gray-900">{formatPrice(product.selling_price)}</span>
          {product.original_price && product.original_price > product.selling_price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
        {product.average_rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">{product.average_rating.toFixed(1)}</span>
          </div>
        )}
        <button
          onClick={handleQuickAdd}
          className="mt-2 w-full py-1.5 text-xs font-semibold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors active:scale-95"
        >
          Add to Cart
        </button>
      </div>
    </Link>
  )
}
