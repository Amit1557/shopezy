import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Search, ChevronRight, Phone, RotateCcw, AlertCircle,
  CheckCircle, Clock, Truck, X, ArrowRight, ShieldCheck, User
} from 'lucide-react'
import { ordersPublicAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo } from '../../utils/helpers'
import { useCustomer } from '../../context/CustomerContext'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MyOrdersPage() {
  const { customer, isCustomerLoggedIn, openAuthModal } = useCustomer()

  const [mobile, setMobile] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Return modal states
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [returnReason, setReturnReason] = useState('Size issue (Too tight / Too loose)')
  const [returnNotes, setReturnNotes] = useState('')
  const [submittingReturn, setSubmittingReturn] = useState(false)

  // Auto-fetch if customer is logged in
  useEffect(() => {
    if (isCustomerLoggedIn && customer?.mobile) {
      setMobile(customer.mobile)
      fetchOrdersForMobile(customer.mobile)
    }
  }, [isCustomerLoggedIn, customer])

  const fetchOrdersForMobile = async (mob) => {
    setLoading(true)
    setSearched(true)
    try {
      const res = await ordersPublicAPI.getMyOrders(mob)
      setOrders(res.data || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleManualSearch = (e) => {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }
    fetchOrdersForMobile(mobile.trim())
  }

  const openReturnModal = (order) => {
    setSelectedOrder(order)
    setReturnReason('Size issue (Too tight / Too loose)')
    setReturnNotes('')
    setReturnModalOpen(true)
  }

  const handleSubmitReturn = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    setSubmittingReturn(true)
    try {
      await ordersPublicAPI.requestReturn({
        order_id: selectedOrder.order_id,
        mobile: mobile.trim() || customer?.mobile,
        reason: returnReason,
        notes: returnNotes.trim() || undefined
      })
      toast.success('Return request submitted! Our team will verify and arrange pickup.')
      setReturnModalOpen(false)
      // Refresh orders
      fetchOrdersForMobile(mobile.trim() || customer?.mobile)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit return request')
    } finally {
      setSubmittingReturn(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Package className="w-7 h-7 text-brand-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">My Orders & Returns</h1>
        <p className="text-xs text-gray-500 mt-1">View your past orders, track live status, or request 7-day doorstep returns</p>
      </div>

      {/* Customer Status Banner */}
      {isCustomerLoggedIn ? (
        <div className="card p-4 mb-6 bg-gradient-to-r from-purple-50 to-brand-50/50 border border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {customer?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-black text-gray-900">Logged in as {customer?.name}</p>
              <p className="text-[11px] text-gray-500 font-mono">+91 {customer?.mobile}</p>
            </div>
          </div>
          <button
            onClick={() => fetchOrdersForMobile(customer.mobile)}
            className="btn-secondary text-xs py-1.5 px-3 font-bold"
          >
            Refresh Orders
          </button>
        </div>
      ) : (
        <div className="card p-5 mb-6 shadow-sm border border-purple-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="text-center sm:text-left">
              <h3 className="text-xs font-black text-gray-900">Have an account?</h3>
              <p className="text-[11px] text-gray-500">Sign in with password to view all your past orders automatically</p>
            </div>
            <button
              onClick={openAuthModal}
              className="btn-primary text-xs py-2 px-4 font-bold shrink-0 flex items-center gap-1.5 shadow-brand"
            >
              <User className="w-3.5 h-3.5" /> Sign In / Login
            </button>
          </div>

          {/* Quick mobile number search fallback */}
          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="Or enter 10-digit mobile number to view orders..."
                className="input-field pl-9 text-xs"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-secondary text-xs py-2.5 px-6 font-bold flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? <LoadingSpinner size="sm" /> : <><Search className="w-4 h-4" /> Find Orders</>}
            </button>
          </form>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : searched && (
        orders.length === 0 ? (
          <div className="card p-10 text-center border-dashed">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-800">No Orders Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              There are no recorded Cash on Delivery orders for mobile number <strong>{mobile}</strong>.
            </p>
            <Link to="/products" className="btn-primary inline-flex text-xs mt-4 font-bold shadow-brand">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
              <span>{orders.length} Order{orders.length > 1 ? 's' : ''} found</span>
              <span className="text-purple-600">7-Day Doorstep Returns Policy</span>
            </div>

            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status)
              const isDelivered = ['DELIVERED', 'COMPLETED'].includes(order.status)
              const isReturnRequested = order.status === 'RETURN_REQUESTED'
              const isReturned = order.status === 'RETURNED'

              return (
                <div key={order.order_id} className="card p-5 hover:border-purple-200 transition-all shadow-sm space-y-4">
                  {/* Order header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-900 text-sm">{order.order_id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Placed on {formatDate(order.created_at)} • Cash on Delivery (COD)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-brand-600">{formatPrice(order.total_amount)}</div>
                      <div className="text-[10px] text-gray-400">Total Amount</div>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50/70 rounded-xl">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400 m-auto mt-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.product_name}</p>
                          <p className="text-[11px] text-gray-500">
                            Size: <span className="font-semibold text-gray-700">{item.selected_size || 'Standard'}</span>
                            {item.selected_color && ` • Color: ${item.selected_color}`}
                            {` • Qty: ${item.quantity}`}
                          </p>
                        </div>
                        <div className="text-xs font-black text-gray-800 shrink-0">
                          {formatPrice(item.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Return Requested Banner */}
                  {isReturnRequested && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Return Request in Progress</span>
                      </div>
                      <p className="text-[11px] text-amber-700">
                        Reason: {order.return_reason || 'Return requested by customer'}
                      </p>
                      <p className="text-[10px] text-amber-600">
                        Our store team has scheduled reverse courier pickup. The courier agent will contact you for doorstep pickup.
                      </p>
                    </div>
                  )}

                  {/* Returned Banner */}
                  {isReturned && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Item Successfully Returned</span>
                        <p className="text-[10px] text-emerald-600">Product was picked up and return was completed successfully.</p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <Link
                      to={`/track-order?order_id=${order.order_id}&mobile=${mobile || customer?.mobile}`}
                      className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      <Truck className="w-3.5 h-3.5" /> Track Delivery Status
                    </Link>

                    {/* Return button if delivered & not already requested */}
                    {isDelivered && !isReturnRequested && !isReturned && (
                      <button
                        type="button"
                        onClick={() => openReturnModal(order)}
                        className="btn-secondary text-xs py-1.5 px-3 font-bold inline-flex items-center gap-1.5 text-gray-700 hover:text-brand-600 hover:border-brand-300"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                        Request Return / Exchange
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* RETURN REQUEST MODAL */}
      {returnModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-100 my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-brand-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-yellow-300" />
                <div>
                  <h3 className="text-sm font-black">Request Item Return</h3>
                  <p className="text-[10px] text-purple-200 font-mono">Order: {selectedOrder.order_id}</p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReturn} className="p-6 space-y-4">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-[11px] text-purple-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Doorstep pickup will be arranged. Product must be in original condition with tags intact.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Reason for Return *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="input-field text-xs font-semibold"
                >
                  <option value="Size issue (Too tight / Too loose)">Size issue (Too tight / Too loose)</option>
                  <option value="Quality not as expected">Quality not as expected</option>
                  <option value="Defective or damaged product">Defective or damaged product</option>
                  <option value="Received wrong item or color">Received wrong item or color</option>
                  <option value="Item looks different from photos">Item looks different from photos</option>
                  <option value="Ordered by mistake / No longer needed">Ordered by mistake / No longer needed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Additional Details / Comments (Optional)</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Tell us what went wrong (e.g., need smaller size M, stitching issue, etc.)..."
                  className="input-field text-xs resize-none"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">Pickup Address</span>
                <p className="text-gray-800 text-[11px] font-medium">
                  {selectedOrder.flat_number}, {selectedOrder.street}, {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="btn-secondary text-xs py-2.5 flex-1 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="btn-primary text-xs py-2.5 flex-1 font-black shadow-brand flex items-center justify-center gap-1.5"
                >
                  {submittingReturn ? <LoadingSpinner size="sm" /> : <><RotateCcw className="w-3.5 h-3.5" /> Confirm Return</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
