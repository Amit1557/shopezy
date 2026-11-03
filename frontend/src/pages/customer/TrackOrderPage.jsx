import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Package, CheckCircle2, Truck, MapPin, XCircle, Clock, Check } from 'lucide-react'
import { ordersPublicAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ORDER_TIMELINE = [
  { key: 'NEW', title: 'Order Placed', desc: 'Customer placed Cash on Delivery order' },
  { key: 'CONFIRMED', title: 'Order Confirmed', desc: 'Seller verified customer address & phone' },
  { key: 'MEESHO_ORDERED', title: 'Processing & Sourced', desc: 'Item ordered from central supplier warehouse' },
  { key: 'SHIPPED', title: 'Shipped', desc: 'Package dispatched with courier service' },
  { key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Courier partner is arriving at doorstep' },
  { key: 'DELIVERED', title: 'Delivered', desc: 'Parcel successfully delivered & payment collected' },
]

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get('order_id') || '')
  const [mobile, setMobile] = useState(searchParams.get('mobile') || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const fetchTrack = async (oid, mob) => {
    if (!oid.trim() || !mob.trim()) {
      toast.error('Please enter Order ID and mobile number')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await ordersPublicAPI.track(oid.trim(), mob.trim())
      setOrder(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail
      toast.error(typeof msg === 'string' ? msg : 'Order not found. Please double check the ID and mobile.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orderId && mobile) {
      fetchTrack(orderId, mobile)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchTrack(orderId, mobile)
  }

  const getStatusIndex = (currentStatus) => {
    const map = {
      NEW: 0,
      CONFIRMED: 1,
      MEESHO_ORDERED: 2,
      SHIPPED: 3,
      OUT_FOR_DELIVERY: 4,
      DELIVERED: 5,
      COMPLETED: 5
    }
    return map[currentStatus] ?? -1
  }

  const isCancelled = ['CANCELLED', 'RETURNED', 'FAILED_DELIVERY'].includes(order?.status)
  const currentStep = getStatusIndex(order?.status)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Truck className="w-7 h-7 text-brand-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Track Your Parcel</h1>
        <p className="text-xs text-gray-500 mt-1">Enter your unique Order ID and mobile number to see real-time updates</p>
      </div>

      {/* Search Input Box */}
      <div className="card p-6 mb-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Order ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. ORD-20241201-0001"
                className="input-field font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="label">Registered Mobile Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="input-field text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? <LoadingSpinner size="sm" color="white" /> : <><Search className="w-4 h-4" /> Track Status</>}
          </button>
        </form>
      </div>

      {/* No Order Found */}
      {searched && !loading && !order && (
        <div className="card p-8 text-center border-red-100 animate-fade-in">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">Order Not Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            We couldn't locate an order with ID <strong>"{orderId}"</strong> registered under mobile <strong>"{mobile}"</strong>.
          </p>
        </div>
      )}

      {/* Tracking Result */}
      {order && (
        <div className="space-y-6 animate-slide-up">
          {/* Status Header Banner */}
          <div className="card p-5 border-brand-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Reference</span>
                <div className="text-xl font-black text-gray-900 font-mono mt-0.5">{order.order_id}</div>
                <div className="text-xs text-gray-400 mt-0.5">Placed on {formatDate(order.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${getStatusInfo(order.status).color}`}>
                  {getStatusInfo(order.status).label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Payment Mode</span>
                <span className="font-bold text-gray-800">Cash on Delivery</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Total COD Amount</span>
                <span className="font-extrabold text-brand-700 text-sm">{formatPrice(order.total_amount)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Delivery Destination</span>
                <span className="font-bold text-gray-800">{order.city}, {order.state}</span>
              </div>
            </div>
          </div>

          {/* Timeline Visualizer */}
          {!isCancelled && (
            <div className="card p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" /> Delivery Progress
              </h3>

              <div className="relative pl-6 space-y-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {ORDER_TIMELINE.map((step, idx) => {
                  const isDone = currentStep >= idx
                  const isCurrent = currentStep === idx

                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                          isDone
                            ? 'bg-brand-600 text-white'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isCurrent ? 'text-brand-700' : isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.title}
                          {isCurrent && (
                            <span className="ml-2 inline-block px-2 py-0.5 text-[10px] bg-brand-100 text-brand-800 rounded font-semibold animate-pulse">
                              Active Status
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cancellation Notice */}
          {isCancelled && (
            <div className="card p-5 bg-red-50/60 border border-red-200 text-red-900">
              <div className="flex items-center gap-3">
                <XCircle className="w-7 h-7 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-xs">Order {getStatusInfo(order.status).label}</h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    This order was marked as {order.status.toLowerCase().replace('_', ' ')}. If you have queries, please reach out to our customer support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items summary */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-600" /> Items in this Order ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                  <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.product_image && (
                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 line-clamp-1">{item.product_name}</p>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {item.selected_size && `Size: ${item.selected_size} • `}
                      {item.selected_color && `Color: ${item.selected_color} • `}
                      Qty: {item.quantity}
                    </div>
                    <div className="font-bold text-gray-900 mt-1">{formatPrice(item.total_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

