import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Copy, Check, ExternalLink, Package, User, MapPin,
  Clock, DollarSign, CheckCircle2, AlertCircle, ShoppingBag, Truck,
  HelpCircle, ChevronDown, ChevronUp, Sparkles, XCircle, RotateCcw
} from 'lucide-react'
import { ordersAdminAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo, ORDER_STATUSES } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  'NEW', 'CONFIRMED', 'MEESHO_ORDERED', 'SHIPPED', 'OUT_FOR_DELIVERY',
  'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'FAILED_DELIVERY'
]

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // Status update state
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  // Internal admin notes
  const [adminNotes, setAdminNotes] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)

  // Meesho fulfilment form state
  const [meeshoForm, setMeeshoForm] = useState({
    meesho_order_id: '',
    meesho_product_link: '',
    actual_purchase_cost: '',
    tracking_info: '',
    expected_delivery_date: '',
    internal_notes: '',
  })
  const [meeshoLoading, setMeeshoLoading] = useState(false)

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await ordersAdminAPI.getById(orderId)
      setOrder(res.data)
      setNewStatus(res.data.status)
      setAdminNotes(res.data.admin_notes || '')
      if (res.data.meesho_fulfilment) {
        const mf = res.data.meesho_fulfilment
        setMeeshoForm({
          meesho_order_id: mf.meesho_order_id || '',
          meesho_product_link: mf.meesho_product_link || '',
          actual_purchase_cost: mf.actual_purchase_cost !== null && mf.actual_purchase_cost !== undefined ? mf.actual_purchase_cost : '',
          tracking_info: mf.tracking_info || '',
          expected_delivery_date: mf.expected_delivery_date ? mf.expected_delivery_date.split('T')[0] : '',
          internal_notes: mf.internal_notes || '',
        })
      }
    } catch (err) {
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const copyAddressToClipboard = () => {
    if (!order) return
    const fullAddress = `Customer: ${order.customer?.name}
Phone: ${order.customer?.mobile}
Address: ${order.flat_number}, ${order.street}
${order.landmark ? `Landmark: ${order.landmark}\n` : ''}City: ${order.city}
State: ${order.state}
Pincode: ${order.pincode}
Payment Method: Cash on Delivery
Order Amount: ₹${order.total_amount}`

    navigator.clipboard.writeText(fullAddress)
    setCopied(true)
    toast.success('Customer address copied! Open Meesho and paste it in checkout.')
    setTimeout(() => setCopied(false), 2500)
  }

  // 1-Click Quick Status Changer
  const handleQuickStatus = async (targetStatus, defaultNote = '') => {
    setStatusLoading(true)
    try {
      await ordersAdminAPI.updateStatus(order.order_id, targetStatus, defaultNote || `Status updated to ${targetStatus}`)
      toast.success(`Status updated to ${ORDER_STATUSES[targetStatus]?.label || targetStatus}`)
      fetchOrder()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  // Handle return actions with Meesho workflow
  const handleReturnAction = async (action, defaultNote = '') => {
    setStatusLoading(true)
    try {
      await ordersAdminAPI.returnAction(order.order_id, {
        action,
        notes: defaultNote,
        meesho_return_id: meeshoForm.meesho_order_id || undefined,
      })
      toast.success(`Return status updated: ${action}`)
      fetchOrder()
    } catch {
      toast.error('Failed to update return action')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleStatusChange = async (e) => {
    e.preventDefault()
    if (!newStatus) return
    setStatusLoading(true)
    try {
      await ordersAdminAPI.updateStatus(order.order_id, newStatus, statusNote || `Status changed to ${newStatus}`)
      toast.success('Order status updated!')
      setStatusNote('')
      fetchOrder()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleNotesSave = async (e) => {
    e.preventDefault()
    setNotesLoading(true)
    try {
      await ordersAdminAPI.updateNotes(order.order_id, adminNotes)
      toast.success('Admin notes saved')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setNotesLoading(false)
    }
  }

  const handleMeeshoSave = async (e, markAsOrdered = false) => {
    if (e) e.preventDefault()
    setMeeshoLoading(true)
    try {
      const payload = {
        meesho_order_id: meeshoForm.meesho_order_id.trim() || null,
        meesho_product_link: meeshoForm.meesho_product_link.trim() || null,
        actual_purchase_cost: meeshoForm.actual_purchase_cost ? parseFloat(meeshoForm.actual_purchase_cost) : null,
        tracking_info: meeshoForm.tracking_info.trim() || null,
        expected_delivery_date: meeshoForm.expected_delivery_date ? new Date(meeshoForm.expected_delivery_date).toISOString() : null,
        internal_notes: meeshoForm.internal_notes.trim() || null,
        is_ordered_on_meesho: markAsOrdered ? true : (order.meesho_fulfilment?.is_ordered_on_meesho || false)
      }
      await ordersAdminAPI.updateMeesho(order.order_id, payload)
      toast.success(markAsOrdered ? 'Successfully marked as ordered on Meesho!' : 'Meesho details saved!')
      fetchOrder()
    } catch {
      toast.error('Failed to update Meesho fulfilment records')
    } finally {
      setMeeshoLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (!order) return (
    <div className="card p-10 text-center">
      <h2 className="text-sm font-bold text-gray-800">Order not found</h2>
      <Link to="/admin/orders" className="btn-primary inline-flex text-xs mt-3">Back to Orders</Link>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Top back bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 font-mono">{order.order_id}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusInfo(order.status).color}`}>
                {getStatusInfo(order.status).label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Placed on {formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Quick action: copy address & Help button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Meesho Process Kaise Kaam Karta Hai?</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={copyAddressToClipboard}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Address Copied!' : 'Copy Customer Address for Meesho'}</span>
          </button>
        </div>
      </div>

      {/* Meesho Workflow Step-by-Step Explainer Guide */}
      {showGuide && (
        <div className="p-5 bg-gradient-to-br from-purple-900 to-brand-950 text-white rounded-2xl shadow-xl space-y-3 animate-slide-up text-xs leading-relaxed">
          <div className="flex items-center justify-between border-b border-purple-800/80 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-brand-200">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Meesho Reselling & Order Status Guide (Simple Hindi)
            </div>
            <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3 bg-purple-900/60 rounded-xl border border-purple-700/50">
              <div className="font-extrabold text-brand-300 mb-1">Step 1: Meesho Pe Order Daalna</div>
              <p className="text-gray-300 text-[11px]">
                Aapko upar <strong>"Copy Customer Address for Meesho"</strong> button dabana hai. Fir Meesho app khol kar ye product dhoondhein aur customer ke address par COD order place karein.
              </p>
            </div>

            <div className="p-3 bg-purple-900/60 rounded-xl border border-purple-700/50">
              <div className="font-extrabold text-brand-300 mb-1">Step 2: Meesho Order ID Yahan Save Karein</div>
              <p className="text-gray-300 text-[11px]">
                Meesho se jo Order ID mile (e.g. 1928374) aur jitne rupaye aapne Meesho ko diye (Purchase Cost), wo daal kar <strong>"MARK AS ORDERED ON MEESHO"</strong> click karein. Isse aapka munafa (Profit) calculate ho jata hai!
              </p>
            </div>

            <div className="p-3 bg-purple-900/60 rounded-xl border border-purple-700/50">
              <div className="font-extrabold text-brand-300 mb-1">Step 3: Tracking & Status Ka Kya Hoga?</div>
              <p className="text-gray-300 text-[11px]">
                <strong>Aapko baar-baar status likhne ki tension nahi hai!</strong> Meesho ka courier (Delhivery/Shadowfax) direct customer ke mobile par SMS bhejta hai. Jab Meesho app me order "Delivered" dikhe, bas yahan 1-click me <strong>"Mark as Delivered"</strong> dabayein!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Quick Action Buttons Bar */}
      <div className="card p-4 bg-white border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-gray-800">Current Status: </span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusInfo(order.status).color}`}>
              {getStatusInfo(order.status).label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 mr-1">Quick 1-Click Actions:</span>
            
            {order.status === 'NEW' && (
              <button
                onClick={() => handleQuickStatus('CONFIRMED', 'Address and customer mobile verified')}
                disabled={statusLoading}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors"
              >
                ✓ Confirm Order
              </button>
            )}

            {order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <button
                onClick={() => handleQuickStatus('SHIPPED', 'Dispatched from warehouse via courier')}
                disabled={statusLoading}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold border border-orange-200 transition-colors flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" /> Mark as Shipped
              </button>
            )}

            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <button
                onClick={() => handleQuickStatus('DELIVERED', 'Delivered to customer and COD payment collected')}
                disabled={statusLoading}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Delivered
              </button>
            )}

            {order.status !== 'CANCELLED' && (
              <button
                onClick={() => {
                  const r = window.prompt('Cancellation reason (optional):', 'Customer requested cancellation')
                  if (r !== null) handleQuickStatus('CANCELLED', r)
                }}
                disabled={statusLoading}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold border border-red-200 transition-colors flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Items & Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-600" /> Products in Order ({order.items?.length || 0})
            </h2>

            <div className="space-y-3">
              {order.items?.map(item => (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-xs">
                  <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">{item.product_name}</h3>
                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 mt-1">
                        {item.selected_size && <span className="bg-white px-2 py-0.5 rounded border border-gray-200">Size: <strong>{item.selected_size}</strong></span>}
                        {item.selected_color && <span className="bg-white px-2 py-0.5 rounded border border-gray-200">Color: <strong>{item.selected_color}</strong></span>}
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">Quantity: <strong>{item.quantity}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-gray-200/60">
                      <span className="text-gray-500 text-[11px]">{formatPrice(item.unit_price)} × {item.quantity}</span>
                      <span className="font-extrabold text-gray-900 text-sm">{formatPrice(item.total_price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-600">Total COD Payable</span>
              <span className="text-lg font-black text-brand-700">{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Customer & Shipping Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-gray-400">Customer Name</span>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-gray-900 text-sm mt-0.5">{order.customer?.name}</div>
                  {order.otp_verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      ✓ Mobile OTP Verified
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-semibold text-gray-800">Phone: </span>
                    <a href={`tel:${order.customer?.mobile}`} className="text-brand-600 font-bold hover:underline">
                      {order.customer?.mobile}
                    </a>
                  </div>
                  <a
                    href={`https://wa.me/91${order.customer?.mobile}?text=${encodeURIComponent(`Namaste ${order.customer?.name || ''}! We received your ShopEzy Order ${order.order_id}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                    title="Open WhatsApp chat with customer"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                </div>
                {order.customer?.alternate_mobile && (
                  <div className="text-gray-500 mt-1">
                    <span>Alt Phone: </span>{order.customer?.alternate_mobile}
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-gray-400">Doorstep Delivery Address</span>
                <div className="text-gray-800 font-medium mt-1 leading-relaxed">
                  <div>{order.flat_number}, {order.street}</div>
                  {order.landmark && <div className="text-gray-500">Landmark: {order.landmark}</div>}
                  <div className="font-bold text-gray-900 mt-0.5">{order.city}, {order.state} - {order.pincode}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status History Trail */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" /> Order Status Audit History
            </h2>
            <div className="space-y-3">
              {order.status_history?.map(hist => (
                <div key={hist.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusInfo(hist.status).color}`}>
                        {getStatusInfo(hist.status).label}
                      </span>
                      <span className="text-[11px] text-gray-400">{formatDate(hist.created_at)}</span>
                    </div>
                    {hist.note && <p className="text-gray-600 text-[11px] mt-0.5">{hist.note}</p>}
                    <span className="text-[10px] text-gray-400">Updated by: {hist.changed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Meesho Fulfilment & Controls */}
        <div className="space-y-6">
          {/* Customer Return Request Box (If requested or returned) */}
          {(order.return_reason || order.status === 'RETURN_REQUESTED' || order.status === 'RETURNED') && (
            <div className="card p-5 border-2 border-amber-300 bg-amber-50/40 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-amber-900 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Customer Return Request
                </h2>
                <span className={`badge text-[10px] font-black ${
                  order.status === 'RETURNED' ? 'badge-success' : 'badge-warning'
                }`}>
                  {order.status === 'RETURNED' ? 'Product Returned' : 'Action Required'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-500">Reason Provided by Customer</span>
                <p className="text-gray-900 font-bold text-xs">{order.return_reason || 'Return requested'}</p>
                {order.return_requested_at && (
                  <p className="text-[10px] text-gray-400">Requested on: {formatDate(order.return_requested_at)}</p>
                )}
              </div>

              {/* Step-by-step instructions for Meesho */}
              <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1.5">
                <p className="font-bold">📦 How to process on Meesho:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800">
                  <li>Open Meesho app / Supplier panel and find Order <strong>#{meeshoForm.meesho_order_id || 'ID'}</strong>.</li>
                  <li>Click <strong>"Return / Exchange"</strong> on Meesho and select the matching reason.</li>
                  <li>Meesho delivery partner will pick up the parcel directly from customer's address.</li>
                </ol>
              </div>

              {/* Admin return action buttons */}
              {order.status === 'RETURN_REQUESTED' && (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleReturnAction('MEESHO_SUBMITTED', 'Return filed on Meesho app')}
                    disabled={statusLoading}
                    className="w-full btn-primary text-xs py-2 font-bold flex items-center justify-center gap-1.5 shadow-brand"
                  >
                    <CheckCircle2 className="w-4 h-4" /> 1. Mark Return Filed on Meesho
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReturnAction('RETURNED', 'Product picked up and returned to Meesho')}
                    disabled={statusLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Package className="w-4 h-4" /> 2. Mark Return Completed / Picked Up
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt('Enter reason for rejecting return request:')
                      if (reason) handleReturnAction('REJECT', reason)
                    }}
                    disabled={statusLoading}
                    className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject Return Request
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Meesho Reseller Fulfilment Box */}
          <div className="card p-5 border-2 border-purple-200 bg-purple-50/20 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" /> Meesho Fulfilment
              </h2>
              {order.meesho_fulfilment?.is_ordered_on_meesho ? (
                <span className="badge bg-purple-100 text-purple-700 font-bold text-[10px]">
                  Ordered on Meesho ✓
                </span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700 font-bold text-[10px]">
                  Pending Placement
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-600 mb-4 bg-white p-2.5 rounded-lg border border-purple-100">
              💡 <strong>Simple Task:</strong> Meesho par order daalne ke baad bas <strong>Meesho Order ID</strong> aur <strong>Purchase Cost</strong> yahan enter karke purple button dabayein!
            </p>

            <form onSubmit={e => handleMeeshoSave(e, false)} className="space-y-3 text-xs">
              <div>
                <label className="label">
                  Meesho Order ID
                  <span className="text-[10px] text-gray-400 block font-normal">(Meesho app ke "My Orders" me se copy karein)</span>
                </label>
                <input
                  type="text"
                  value={meeshoForm.meesho_order_id}
                  onChange={e => setMeeshoForm(f => ({ ...f, meesho_order_id: e.target.value }))}
                  placeholder="e.g. 192837465"
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="label">
                  Actual Purchase Cost (₹)
                  <span className="text-[10px] text-gray-400 block font-normal">(Meesho par aapne kitne rupaye pay kiye)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={meeshoForm.actual_purchase_cost}
                  onChange={e => setMeeshoForm(f => ({ ...f, actual_purchase_cost: e.target.value }))}
                  placeholder="e.g. 320"
                  className="input-field text-xs font-semibold"
                />
              </div>

              {/* Live profit calculation */}
              {meeshoForm.actual_purchase_cost && (
                <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Website Selling Price:</span>
                    <span className="font-bold">{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Meesho Purchase Cost:</span>
                    <span className="font-bold text-red-600">− {formatPrice(parseFloat(meeshoForm.actual_purchase_cost) || 0)}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-700 pt-1 border-t border-gray-100 text-sm">
                    <span>Aapka Net Profit:</span>
                    <span>{formatPrice(order.total_amount - (parseFloat(meeshoForm.actual_purchase_cost) || 0))}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Courier Name / Tracking Link (Optional)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={meeshoForm.tracking_info}
                    onChange={e => setMeeshoForm(f => ({ ...f, tracking_info: e.target.value }))}
                    placeholder="e.g. Delhivery AWB #12345678 or Link"
                    className="input-field text-xs flex-1"
                  />
                  {meeshoForm.tracking_info && meeshoForm.tracking_info.startsWith('http') && (
                    <a
                      href={meeshoForm.tracking_info}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold text-xs flex items-center gap-1"
                      title="Open courier tracking link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Track
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Expected Delivery Date (Optional)</label>
                <input
                  type="date"
                  value={meeshoForm.expected_delivery_date}
                  onChange={e => setMeeshoForm(f => ({ ...f, expected_delivery_date: e.target.value }))}
                  className="input-field text-xs"
                />
              </div>

              {/* The "MARK AS ORDERED ON MEESHO" Button */}
              <button
                type="button"
                onClick={e => handleMeeshoSave(e, true)}
                disabled={meeshoLoading}
                className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                {meeshoLoading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> MARK AS ORDERED ON MEESHO
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={meeshoLoading}
                className="btn-outline w-full py-2 text-xs font-bold"
              >
                Save Details Only
              </button>
            </form>
          </div>

          {/* Status Update Card */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 text-sm mb-3">Custom Status Update (Optional)</h2>
            <form onSubmit={handleStatusChange} className="space-y-3 text-xs">
              <div>
                <label className="label">Order Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="input-field text-xs font-bold"
                >
                  {STATUS_OPTIONS.map(st => (
                    <option key={st} value={st}>{ORDER_STATUSES[st]?.label || st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Status Change Note (Optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched via Shadowfax"
                  className="input-field text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={statusLoading}
                className="btn-primary w-full py-2.5 text-xs font-bold"
              >
                {statusLoading ? <LoadingSpinner size="sm" color="white" /> : 'Update Status'}
              </button>
            </form>
          </div>

          {/* Admin Internal Private Notes */}
          <div className="card p-5">
            <h2 className="font-extrabold text-gray-900 text-sm mb-3">Private Admin Notes</h2>
            <form onSubmit={handleNotesSave} className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Private store owner notes (customer never sees this)..."
                className="input-field text-xs"
              />
              <button
                type="submit"
                disabled={notesLoading}
                className="btn-secondary w-full py-2 text-xs font-bold"
              >
                {notesLoading ? <LoadingSpinner size="sm" /> : 'Save Internal Notes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
