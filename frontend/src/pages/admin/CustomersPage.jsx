import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Users, Phone, MapPin, Eye, ShoppingBag, ArrowLeft,
  UserCheck, Repeat, TrendingUp, Mail, Package, RotateCcw,
  CheckCircle2, Clock, XCircle, ExternalLink, Calendar
} from 'lucide-react'
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

  // CRM stats
  const [stats, setStats] = useState({
    total_customers: 0,
    total_registered: 0,
    repeat_customers: 0,
    total_revenue: 0
  })

  // Selected customer dossier
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [customerDetail, setCustomerDetail] = useState(null)

  const fetchCustomers = async (p = 1, silent = false) => {
    if (!silent && customers.length === 0) setLoading(true)
    try {
      const res = await analyticsAPI.getCustomers({ page: p, limit: 15, search: search.trim() || undefined })
      setCustomers(res.data.customers || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
      setPage(p)
      if (res.data.stats) {
        setStats(res.data.stats)
      }
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1, customers.length > 0)
  }, [search])

  const openCustomerModal = async (cust) => {
    setSelectedCustomer(cust)
    setDetailLoading(true)
    try {
      const res = await analyticsAPI.getCustomerDetail(cust.id)
      setCustomerDetail(res.data)
    } catch {
      setCustomerDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Customer Records & CRM</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete database of all your buyers, repeat purchasers & item purchase history
          </p>
        </div>
      </div>

      {/* Top CRM Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border border-purple-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase">Total Customers</div>
            <div className="text-xl font-black text-gray-900">{stats.total_customers}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Recorded in database</div>
          </div>
        </div>

        <div className="card p-4 border border-blue-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase">Registered Users</div>
            <div className="text-xl font-black text-blue-700">{stats.total_registered}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Password protected accounts</div>
          </div>
        </div>

        <div className="card p-4 border border-emerald-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase">Repeat Buyers</div>
            <div className="text-xl font-black text-emerald-700">{stats.repeat_customers}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Ordered 2+ times</div>
          </div>
        </div>

        <div className="card p-4 border border-brand-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase">Total Customer Spend</div>
            <div className="text-xl font-black text-brand-700">{formatPrice(stats.total_revenue)}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Lifetime sales generated</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer by full name, 10-digit mobile number, or email..."
            className="input-field pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden relative">
        {loading && customers.length > 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
            <LoadingSpinner size="md" />
          </div>
        )}
        {loading && customers.length === 0 ? (
          <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-gray-700">No Customer Records Found</h3>
            <p className="text-xs text-gray-500 mt-1">Customers will appear here when they register or place Cash on Delivery orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Mobile / Contact</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Joined On</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs shrink-0">
                          {c.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{c.name}</div>
                          {c.email && <div className="text-[10px] text-gray-400">{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-700">
                      +91 {c.mobile}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.has_account ? (
                        <span className="badge badge-success text-[10px] font-bold">
                          ✓ Registered Account
                        </span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-600 text-[10px] font-bold">
                          Guest Buyer
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-900 text-sm">
                      {c.total_orders}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {c.delivered_orders} Delivered
                      </span>
                      {c.returned_orders > 0 && (
                        <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px] ml-1">
                          {c.returned_orders} Ret
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-black text-brand-700 text-sm">
                      {formatPrice(c.total_value)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{formatDate(c.created_at)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openCustomerModal(c)}
                        className="btn-primary text-[11px] py-1.5 px-3 font-bold inline-flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Purchase Dossier
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

      {/* Comprehensive Customer Intelligence Dossier Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100 my-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 via-brand-800 to-purple-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 text-white font-black text-base flex items-center justify-center backdrop-blur-md">
                  {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    {selectedCustomer.name}
                    {selectedCustomer.has_account && (
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Verified Member
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-purple-200">
                    Phone: +91 {selectedCustomer.mobile} {selectedCustomer.email && `• ${selectedCustomer.email}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {detailLoading ? (
                <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
              ) : customerDetail && (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-center">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Total Orders</span>
                      <div className="text-base font-black text-gray-900">{customerDetail.stats?.total_orders}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Delivered</span>
                      <div className="text-base font-black text-emerald-600">{customerDetail.stats?.delivered_count}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 font-bold uppercase">Returns</span>
                      <div className="text-base font-black text-amber-600">{customerDetail.stats?.returned_count}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-600 font-bold uppercase">Total Spend</span>
                      <div className="text-base font-black text-brand-600">{formatPrice(customerDetail.stats?.lifetime_spent)}</div>
                    </div>
                  </div>

                  {/* Saved Addresses */}
                  {customerDetail.saved_addresses?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" /> Doorstep Delivery Addresses Used:
                      </span>
                      <div className="space-y-1">
                        {customerDetail.saved_addresses.map((addr, idx) => (
                          <p key={idx} className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-800 font-medium">
                            {addr}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Purchase History Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-purple-600" />
                      Everything This Customer Purchased ({customerDetail.orders?.length || 0} Orders)
                    </h4>

                    {customerDetail.orders?.length === 0 ? (
                      <p className="text-gray-400 py-4 text-center text-xs">No orders recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {customerDetail.orders.map(o => {
                          const statusInfo = getStatusInfo(o.status)
                          return (
                            <div key={o.order_id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
                              {/* Order bar */}
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-gray-900 text-xs">{o.order_id}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">
                                    {formatDate(o.created_at)} • COD
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-sm text-brand-600">{formatPrice(o.total_amount)}</div>
                                  <Link
                                    to={`/admin/orders/${o.order_id}`}
                                    className="text-[10px] text-purple-700 hover:underline font-bold inline-flex items-center gap-0.5"
                                  >
                                    View in Orders <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                </div>
                              </div>

                              {/* Exact Items Bought */}
                              <div className="space-y-1.5">
                                {o.items?.map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-lg text-xs">
                                    <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 shrink-0">
                                      {it.product_image ? (
                                        <img src={it.product_image} alt={it.product_name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-900 truncate">{it.product_name}</p>
                                      <p className="text-[10px] text-gray-500">
                                        Size: <strong className="text-gray-700">{it.selected_size || 'Std'}</strong>
                                        {it.selected_color && ` • Color: ${it.selected_color}`}
                                        {` • Qty: ${it.quantity} × ${formatPrice(it.unit_price)}`}
                                      </p>
                                    </div>
                                    <div className="font-bold text-gray-900 shrink-0">
                                      {formatPrice(it.total_price)}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Return reason if applicable */}
                              {o.return_reason && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-800 flex items-center gap-2">
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Customer Return Reason: <strong>{o.return_reason}</strong></span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="btn-secondary text-xs py-2 px-5 font-bold"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
