import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Users, TrendingUp, DollarSign, Clock, Truck,
  CheckCircle2, XCircle, ArrowUpRight, AlertTriangle, PackageSearch, RefreshCw
} from 'lucide-react'
import { analyticsAPI, ordersAdminAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function DashboardPage() {
  const [period, setPeriod] = useState('all')
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes] = await Promise.all([
        analyticsAPI.getDashboard(period),
        ordersAdminAPI.getAll({ limit: 6 })
      ])
      setStats(statsRes.data)
      setRecentOrders(ordersRes.data.orders || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [period])

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Store Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time performance of your COD reselling business</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStats}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Main Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sales */}
            <div className="card p-5 border-l-4 border-l-brand-600">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
                <span>Total COD Gross Sales</span>
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900 mt-2">
                {formatPrice(stats?.total_sales || 0)}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Excludes cancelled & returned orders</div>
            </div>

            {/* Expected Margin */}
            <div className="card p-5 border-l-4 border-l-indigo-600">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
                <span>Expected Profit Margin</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-700 mt-2">
                {formatPrice(stats?.total_expected_margin || 0)}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Estimated markup across active orders</div>
            </div>

            {/* Actual Profit */}
            <div className="card p-5 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
                <span>Actual Realized Profit</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                {formatPrice(stats?.total_actual_profit || 0)}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">From successfully delivered orders</div>
            </div>

            {/* Customers */}
            <div className="card p-5 border-l-4 border-l-pink-600">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
                <span>Total Unique Customers</span>
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900 mt-2">
                {stats?.total_customers || 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Verified customer phone profiles</div>
            </div>
          </div>

          {/* Action Required: New orders needing Meesho placement banner */}
          {(stats?.new_orders > 0 || stats?.confirmed > 0) && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-amber-900">
                    {stats.new_orders + (stats.confirmed || 0)} Order(s) Need Meesho Placement!
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Customers have placed Cash on Delivery orders. Open Meesho, place corresponding reseller orders, and update Meesho Order IDs.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/orders?status=NEW"
                className="btn-primary text-xs py-2 px-4 whitespace-nowrap self-start sm:self-auto font-bold"
              >
                Fulfill Pending Orders →
              </Link>
            </div>
          )}

          {/* Operational Order Funnel Badges */}
          <div className="card p-5">
            <h2 className="text-sm font-extrabold text-gray-900 mb-4">Orders Pipeline Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-center">
                <div className="text-xs text-blue-600 font-bold">New Orders</div>
                <div className="text-xl font-black text-blue-900 mt-1">{stats?.new_orders || 0}</div>
              </div>
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-center">
                <div className="text-xs text-indigo-600 font-bold">Confirmed</div>
                <div className="text-xl font-black text-indigo-900 mt-1">{stats?.confirmed || 0}</div>
              </div>
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-100 text-center">
                <div className="text-xs text-purple-600 font-bold">Meesho Ordered</div>
                <div className="text-xl font-black text-purple-900 mt-1">{stats?.meesho_ordered || 0}</div>
              </div>
              <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-100 text-center">
                <div className="text-xs text-orange-600 font-bold">Shipped</div>
                <div className="text-xl font-black text-orange-900 mt-1">{stats?.shipped || 0}</div>
              </div>
              <div className="p-3 bg-yellow-50/80 rounded-xl border border-yellow-100 text-center">
                <div className="text-xs text-yellow-600 font-bold">Out for Delivery</div>
                <div className="text-xl font-black text-yellow-900 mt-1">{stats?.out_for_delivery || 0}</div>
              </div>
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 text-center">
                <div className="text-xs text-emerald-600 font-bold">Delivered</div>
                <div className="text-xl font-black text-emerald-900 mt-1">{stats?.delivered || 0}</div>
              </div>
              <div className="p-3 bg-red-50/80 rounded-xl border border-red-100 text-center">
                <div className="text-xs text-red-600 font-bold">Cancelled</div>
                <div className="text-xl font-black text-red-900 mt-1">{stats?.cancelled || 0}</div>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Recent Customer Orders</h2>
                <p className="text-xs text-gray-400 mt-0.5">Latest COD orders placed on your store</p>
              </div>
              <Link to="/admin/orders" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Meesho Sourced</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        No customer orders received yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          {order.order_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{order.customer?.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{order.customer?.mobile}</div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {order.city}, {order.state}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-gray-900">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusInfo(order.status).color}`}>
                            {getStatusInfo(order.status).label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {order.meesho_fulfilment?.is_ordered_on_meesho ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              <CheckCircle2 className="w-3 h-3 text-purple-600" /> ID: {order.meesho_fulfilment.meesho_order_id || 'Yes'}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Pending Placement
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/admin/orders/${order.order_id}`}
                            className="font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors inline-block"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

