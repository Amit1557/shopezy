import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Package, ChevronRight, CheckCircle, AlertCircle, ShieldCheck, MapPin, Phone, User, Sparkles } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCustomer } from '../../context/CustomerContext'
import { ordersPublicAPI } from '../../services/api'
import { formatPrice, validateMobile, validatePincode, INDIAN_STATES } from '../../utils/helpers'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const initialForm = {
  customer_name: '',
  customer_mobile: '',
  customer_alternate_mobile: '',
  flat_number: '',
  street: '',
  landmark: '',
  city: '',
  state: '',
  pincode: ''
}

export default function CheckoutPage() {
  const { cart, totalAmount, clearCart } = useCart()
  const { customer, isCustomerLoggedIn, openAuthModal } = useCustomer()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(null)

  useEffect(() => {
    if (isCustomerLoggedIn && customer) {
      setForm(prev => ({
        ...prev,
        customer_name: prev.customer_name || customer.name || '',
        customer_mobile: prev.customer_mobile || customer.mobile || '',
        customer_alternate_mobile: prev.customer_alternate_mobile || customer.alternate_mobile || '',
      }))
    }
  }, [isCustomerLoggedIn, customer])

  if (cart.items.length === 0 && !orderPlaced) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No items to checkout</h2>
        <p className="text-xs text-gray-500 mb-6">Your shopping cart is empty. Please add products first.</p>
        <Link to="/products" className="btn-primary inline-flex text-xs">Browse Catalog</Link>
      </div>
    )
  }

  const validate = () => {
    const e = {}
    if (!form.customer_name.trim()) e.customer_name = 'Full name is required'
    if (!validateMobile(form.customer_mobile)) e.customer_mobile = 'Enter a valid 10-digit Indian mobile number'
    if (form.customer_alternate_mobile && !validateMobile(form.customer_alternate_mobile)) {
      e.customer_alternate_mobile = 'Enter a valid 10-digit mobile number'
    }
    if (!form.flat_number.trim()) e.flat_number = 'House / Flat / Building is required'
    if (!form.street.trim()) e.street = 'Street / Colony / Locality is required'
    if (!form.city.trim()) e.city = 'City / Town is required'
    if (!form.state) e.state = 'State selection is required'
    if (!validatePincode(form.pincode)) e.pincode = 'Enter a valid 6-digit PIN code'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please complete all required fields')
      return
    }
    setLoading(true)
    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_mobile: form.customer_mobile.trim(),
        customer_alternate_mobile: form.customer_alternate_mobile.trim() || null,
        flat_number: form.flat_number.trim(),
        street: form.street.trim(),
        landmark: form.landmark.trim() || null,
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
        items: cart.items.map(i => ({
          product_id: i.product_id,
          selected_size: i.selected_size,
          selected_color: i.selected_color,
          quantity: i.quantity
        }))
      }
      const res = await ordersPublicAPI.place(payload)
      clearCart()
      setOrderPlaced(res.data)
      toast.success('Order placed successfully via Cash on Delivery!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order. Please review your address.'
      toast.error(typeof msg === 'string' ? msg : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  // Order Confirmed Screen
  if (orderPlaced) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="card p-8 text-center animate-slide-up border-green-100 shadow-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed! 🎉</h1>
          <p className="text-xs text-gray-500 mb-6">
            Thank you! Your Cash on Delivery order has been registered and is being prepared.
          </p>

          <div className="bg-brand-50/60 rounded-2xl p-5 mb-6 text-left border border-brand-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Your Unique Order ID</div>
            <div className="text-2xl font-black text-brand-700 font-mono mt-1 select-all">{orderPlaced.order_id}</div>
            <div className="flex items-center justify-between text-xs text-gray-700 mt-3 pt-3 border-t border-brand-100">
              <span>Total Payable upon Delivery:</span>
              <span className="font-bold text-gray-900 text-sm">{formatPrice(orderPlaced.total_amount)}</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Payment Method: <strong>Cash on Delivery (COD)</strong></div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800 text-left">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Package className="w-4 h-4 text-amber-600" /> Please save your Order ID!
            </div>
            <div>
              You can track your parcel anytime by entering your Order ID <strong>{orderPlaced.order_id}</strong> and mobile number.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/track-order?order_id=${orderPlaced.order_id}&mobile=${form.customer_mobile}`}
              className="flex-1 btn-secondary text-xs py-3 text-center font-bold"
            >
              Track This Order
            </Link>
            <Link
              to="/products"
              className="flex-1 btn-primary text-xs py-3 text-center font-bold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Checkout – Cash on Delivery</h1>
        <p className="text-xs text-gray-500 mt-1">Please enter your exact delivery details. Payment will be collected at your door.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Details */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* 1. Contact Information */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2 text-sm">
              <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Customer Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer full name"
                    className={`input-field pl-9 ${errors.customer_name ? 'border-red-400 focus:ring-red-200' : ''}`}
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.customer_name && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.customer_name}</p>}
              </div>

              <div>
                <label className="label">Mobile Number (Calling & WhatsApp) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="tel"
                    name="customer_mobile"
                    maxLength={10}
                    value={form.customer_mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`input-field pl-9 ${errors.customer_mobile ? 'border-red-400 focus:ring-red-200' : ''}`}
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.customer_mobile && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.customer_mobile}</p>}
              </div>

              <div>
                <label className="label">Alternate Mobile Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input
                    type="tel"
                    name="customer_alternate_mobile"
                    maxLength={10}
                    value={form.customer_alternate_mobile}
                    onChange={handleChange}
                    placeholder="Optional backup number"
                    className={`input-field pl-9 ${errors.customer_alternate_mobile ? 'border-red-400 focus:ring-red-200' : ''}`}
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.customer_alternate_mobile && <p className="text-[11px] text-red-500 mt-1">{errors.customer_alternate_mobile}</p>}
              </div>
            </div>
          </div>

          {/* 2. Delivery Address */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2 text-sm">
              <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Delivery Address (Doorstep)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">House / Flat / Building No. <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="flat_number"
                  value={form.flat_number}
                  onChange={handleChange}
                  placeholder="e.g. Flat 302, Green Villa"
                  className={`input-field ${errors.flat_number ? 'border-red-400' : ''}`}
                />
                {errors.flat_number && <p className="text-[11px] text-red-500 mt-1">{errors.flat_number}</p>}
              </div>

              <div>
                <label className="label">Street / Colony / Area <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="e.g. MG Road, Near Shiv Temple"
                  className={`input-field ${errors.street ? 'border-red-400' : ''}`}
                />
                {errors.street && <p className="text-[11px] text-red-500 mt-1">{errors.street}</p>}
              </div>

              <div>
                <label className="label">Landmark <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  placeholder="e.g. Near State Bank ATM"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">City / Town <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Jaipur"
                  className={`input-field ${errors.city ? 'border-red-400' : ''}`}
                />
                {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="label">State <span className="text-red-500">*</span></label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className={`input-field ${errors.state ? 'border-red-400' : ''}`}
                >
                  <option value="">-- Choose State --</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <p className="text-[11px] text-red-500 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="label">6-Digit PIN Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 302001"
                  className={`input-field ${errors.pincode ? 'border-red-400' : ''}`}
                />
                {errors.pincode && <p className="text-[11px] text-red-500 mt-1">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* 3. Payment Mode Confirmation */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Payment Option
            </h2>
            <div className="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-900">Cash on Delivery (COD)</div>
                  <div className="text-[11px] text-emerald-700">Pay cash in hand when the courier delivers your package.</div>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-emerald-600 flex items-center justify-center bg-white">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-sm font-extrabold flex items-center justify-center gap-2 shadow-brand active:scale-[0.99] transition-all"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>Place Cash on Delivery Order <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        {/* Order Items Preview */}
        <div>
          <div className="card p-5 sticky top-24">
            <h2 className="font-extrabold text-gray-900 mb-4 text-sm">Order Summary</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
              {cart.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.product_image && (
                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 line-clamp-1">{item.product_name}</p>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {item.selected_size && `Size: ${item.selected_size} • `}
                      {item.selected_color && `Color: ${item.selected_color} • `}
                      Qty: {item.quantity}
                    </div>
                    <div className="font-bold text-gray-900 mt-1">
                      {formatPrice(item.unit_price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Doorstep Delivery</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-extrabold text-gray-900">
                <span>Total Amount</span>
                <span className="text-brand-700 text-base">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Zero cancellation fee before parcel dispatch.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

