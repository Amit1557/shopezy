import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Filter, ChevronLeft, ChevronRight, Eye, RefreshCw,
  Calendar, CheckCircle2, AlertCircle, ShoppingBag, ArrowUpDown
} from 'lucide-react'
import { ordersAdminAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'

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

  const fetchOrders = async () => {
    setLoading(true)
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
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
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
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
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
                      <Link
                        to={`/admin/orders/${order.order_id}`}
                        className="btn-primary text-[11px] py-1.5 px-3 font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Manage
                      </Link>
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
    </div>
  )
}

