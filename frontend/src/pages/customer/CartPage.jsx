import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package, ShieldCheck } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/helpers'
import EmptyState from '../../components/ui/EmptyState'

export default function CartPage() {
  const { cart, removeItem, updateQuantity, totalAmount, totalItems } = useCart()
  const navigate = useNavigate()

  if (cart.items.length === 0) return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <EmptyState
        icon={ShoppingBag}
        title="Your shopping cart is empty"
        description="Explore our trendy catalog with Free Cash on Delivery and add your favorite items!"
        action={<Link to="/products" className="btn-primary mt-2">Explore Products</Link>}
      />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Shopping Cart <span className="text-sm text-gray-500 font-normal">({totalItems} items)</span>
        </h1>
        <Link to="/products" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          + Add More Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Item Cards */}
        <div className="lg:col-span-2 space-y-3.5">
          {cart.items.map((item, index) => (
            <div key={index} className="card p-4 flex gap-4 transition-all hover:shadow-sm">
              <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                {item.product_image ? (
                  <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <Link
                    to={`/product/${item.product_slug}`}
                    className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-brand-600 line-clamp-2 leading-snug"
                  >
                    {item.product_name}
                  </Link>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {item.selected_size && (
                      <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                        Size: {item.selected_size}
                      </span>
                    )}
                    {item.selected_color && (
                      <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                        Color: {item.selected_color}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-700 font-bold active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-6 text-center text-gray-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-700 font-bold active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-gray-900">
                      {formatPrice(item.unit_price * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-gray-400">
                        {formatPrice(item.unit_price)} each
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeItem(index)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 self-start rounded-lg hover:bg-red-50"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div>
          <div className="card p-5 sticky top-24">
            <h2 className="font-extrabold text-gray-900 mb-4 text-base">Price Details</h2>
            <div className="space-y-3 mb-5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total Product Price ({totalItems} items)</span>
                <span className="font-semibold text-gray-900">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>COD Convenience Charge</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-extrabold text-gray-900">
                <span>Order Total</span>
                <span className="text-brand-700 text-lg">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-emerald-800 text-xs">
              <Package className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">Cash on Delivery Eligible!</span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  No online payment needed now. Pay exact amount upon physical parcel arrival.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-brand"
            >
              Proceed to COD Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Safe & Secure Order Processing
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

