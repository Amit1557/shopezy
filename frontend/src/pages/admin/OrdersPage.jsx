import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Filter, ChevronLeft, ChevronRight, Eye, RefreshCw,
  Calendar, CheckCircle2, AlertCircle, ShoppingBag, ArrowUpDown, Trash2
} from 'lucide-react'
import { ordersAdminAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { id: '', label: 'All Orders' },
  { id: 'NEW', label: 'New' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'MEESHO_ORDERED', label: 'Meesho Ordered' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'RETURN_REQUESTED', label: '⚠️ Return Requested' },
  { id: 'RETURNED', label: 'Returned' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(search)
  const [deletingOrder, setDeletingOrder] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return
    setDeleteLoading(true)
    try {
      await ordersAdminAPI.delete(deletingOrder.order_id)
      toast.success(`Order ${deletingOrder.order_id} deleted successfully!`)
      setOrders(prev => prev.filter(o => o.order_id !== deletingOrder.order_id))
      setTotal(prev => Math.max(0, prev - 1))
      setDeletingOrder(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete order')
    } finally {
      setDeleteLoading(false)
    }
  }

  const fetchOrders = async (silent = false) => {
    if (!silent && orders.length === 0) setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (status) params.status = status
      if (search) params.search = search
      const res = await ordersAdminAPI.getAll(params)
      setOrders(res.data.orders || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
    } catch (err) {
      console.error(err)
      if (orders.length === 0) setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(orders.length > 0)
  }, [searchParams])

  const updateParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParam('search', searchInput.trim())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Order Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage customer orders & Meesho reseller fulfilment</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-secondary self-start sm:self-auto text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
        </button>
      </div>

      {/* Status filter navigation tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => updateParam('status', tab.id)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              status === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by Order ID (e.g. ORD-...), Customer Name, or 10-digit Mobile..."
              className="input-field pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button type="submit" className="btn-primary text-xs px-5 font-bold">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); updateParam('search', '') }}
              className="btn-outline text-xs px-3"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden relative">
        {loading && orders.length > 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
            <LoadingSpinner size="md" />
          </div>
        )}
        {loading && orders.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 px-4 bg-gray-50/70 rounded-xl">
                <div className="space-y-1.5 w-1/4">
                  <div className="h-3.5 bg-gray-200 rounded w-28" />
                  <div className="h-2.5 bg-gray-100 rounded w-20" />
                </div>
                <div className="space-y-1.5 w-1/4">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2.5 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-3.5 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-purple-100 rounded-full w-24" />
                <div className="h-7 bg-gray-200 rounded-lg w-20" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-gray-700">No Orders Found</h3>
            <p className="text-xs text-gray-500 mt-1">There are no orders matching your selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Items Ordered</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Meesho Fulfilment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Order ID & Date */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-gray-900 block">{order.order_id}</span>
                      <span className="text-[11px] text-gray-400">{formatDate(order.created_at)}</span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-900">{order.customer?.name}</span>
                        {order.otp_verified && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 tracking-wider">
                            ✓ OTP
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-gray-500">{order.customer?.mobile}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[180px]">
                        {order.flat_number}, {order.street}, {order.city} - {order.pincode}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-[200px]">
                        {order.items?.map(it => (
                          <div key={it.id} className="truncate text-gray-700 font-medium">
                            • {it.product_name} <span className="text-gray-400">({it.selected_size ? `${it.selected_size}, ` : ''}Qty: {it.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-black text-gray-900">
                      {formatPrice(order.total_amount)}
                      <div className="text-[10px] font-semibold text-emerald-600">Cash on Delivery</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusInfo(order.status).color}`}>
                        {getStatusInfo(order.status).label}
                      </span>
                    </td>

                    {/* Meesho Fulfilment */}
                    <td className="py-3.5 px-4">
                      {order.meesho_fulfilment?.is_ordered_on_meesho ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            <CheckCircle2 className="w-3 h-3 text-purple-600" /> Meesho ID: {order.meesho_fulfilment.meesho_order_id || 'Done'}
                          </span>
                          {order.meesho_fulfilment.actual_purchase_cost && (
                            <div className="text-[10px] text-gray-500">
                              Cost: {formatPrice(order.meesho_fulfilment.actual_purchase_cost)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-500" /> Sourcing Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/orders/${order.order_id}`}
                          className="btn-primary text-[11px] py-1.5 px-3 font-bold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Manage
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeletingOrder(order)}
                          title="Delete Order Permanently"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination page={page} pages={pages} onPageChange={p => updateParam('page', p)} />

      {/* Delete Order Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Delete Customer Order?</h3>
                <p className="text-xs text-gray-500">Permanent removal from system</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete order <strong className="font-mono text-gray-900">{deletingOrder.order_id}</strong> for customer <strong className="text-gray-900">{deletingOrder.customer?.name}</strong>?
              <br />
              <span className="text-red-600 text-[11px] font-semibold mt-1.5 block">
                ⚠️ All order items, Meesho sourcing records, and tracking history for this order will be permanently erased.
              </span>
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                disabled={deleteLoading}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                {deleteLoading ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

