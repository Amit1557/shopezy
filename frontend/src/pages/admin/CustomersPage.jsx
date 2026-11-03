import { useState, useEffect } from 'react'
import { Search, Users, Phone, MapPin, Eye, ShoppingBag, ArrowLeft } from 'lucide-react'
import { analyticsAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Selected customer drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [customerOrders, setCustomerOrders] = useState([])

  const fetchCustomers = async (p = 1) => {
    setLoading(true)
    try {
      const res = await analyticsAPI.getCustomers({ page: p, limit: 15, search: search.trim() || undefined })
      setCustomers(res.data.customers || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
      setPage(p)
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1)
  }, [search])

  const openCustomerModal = async (cust) => {
    setSelectedCustomer(cust)
    setDetailLoading(true)
    try {
      const res = await analyticsAPI.getCustomerDetail(cust.id)
      setCustomerOrders(res.data.orders || [])
    } catch {
      setCustomerOrders([])
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Customer Records</h1>
          <p className="text-xs text-gray-500 mt-0.5">Maintain customer mobile profiles & repeat purchase history</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer by name or 10-digit mobile number..."
            className="input-field pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-gray-700">No Customer Records Yet</h3>
            <p className="text-xs text-gray-500 mt-1">Customers will appear here when they place Cash on Delivery orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Cancelled</th>
                  <th className="py-3 px-4">First Order Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{c.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-700">{c.mobile}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{c.total_orders}</td>
                    <td className="py-3.5 px-4 font-extrabold text-brand-700 text-sm">
                      {formatPrice(c.total_value)}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.cancelled_orders > 0 ? (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px]">
                          {c.cancelled_orders}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{formatDate(c.created_at)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openCustomerModal(c)}
                        className="btn-outline text-[11px] py-1.5 px-3 font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Order History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pages={pages} onPageChange={p => fetchCustomers(p)} />

      {/* Customer Profile Modal */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer Profile: ${selectedCustomer?.name || ''}`}
        size="md"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Registered Phone</span>
                <div className="font-mono font-bold text-gray-900 text-base">{selectedCustomer.mobile}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Customer Since</span>
                <div className="font-medium text-gray-700">{formatDate(selectedCustomer.created_at)}</div>
              </div>
            </div>

            <h3 className="font-bold text-gray-900 text-sm mt-4">Past Orders</h3>

            {detailLoading ? (
              <div className="py-10 flex justify-center"><LoadingSpinner size="md" /></div>
            ) : customerOrders.length === 0 ? (
              <p className="text-gray-400 py-4 text-center">No orders found.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {customerOrders.map(o => (
                  <div key={o.order_id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
                    <div>
                      <div className="font-mono font-bold text-gray-900">{o.order_id}</div>
                      <div className="text-[10px] text-gray-400">{formatDate(o.created_at)} • {o.items_count} items</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-gray-900 text-sm">{formatPrice(o.total_amount)}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusInfo(o.status).color}`}>
                        {getStatusInfo(o.status).label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

