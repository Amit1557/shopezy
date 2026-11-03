import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, RefreshCw, BarChart2, PieChart, ArrowUpRight
} from 'lucide-react'
import { analyticsAPI } from '../../services/api'
import { formatPrice, formatDate, getStatusInfo } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30days')
  const [dashboard, setDashboard] = useState(null)
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashRes, repRes] = await Promise.all([
        analyticsAPI.getDashboard(period),
        analyticsAPI.getProfitReport(period)
      ])
      setDashboard(dashRes.data)
      setReport(repRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  // Calculation helpers
  const totalReportRevenue = report
    .filter(r => !['CANCELLED', 'RETURNED'].includes(r.status))
    .reduce((sum, r) => sum + (r.selling_price || 0), 0)

  const totalReportCost = report
    .filter(r => !['CANCELLED', 'RETURNED'].includes(r.status) && r.purchase_cost !== null)
    .reduce((sum, r) => sum + (r.purchase_cost || 0), 0)

  const totalReportProfit = report
    .filter(r => ['DELIVERED', 'COMPLETED'].includes(r.status) && r.actual_profit !== null)
    .reduce((sum, r) => sum + (r.actual_profit || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Profit & Revenue Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Comprehensive audit of actual profits, sourcing costs & margins</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
            {[
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
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
          <button onClick={fetchData} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 bg-gradient-to-br from-brand-900 to-gray-900 text-white shadow-brand">
              <span className="text-xs text-brand-200 font-bold uppercase tracking-wider block">Realized Net Profit</span>
              <div className="text-3xl font-black mt-2 text-white">
                {formatPrice(dashboard?.total_actual_profit || 0)}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Pure earnings collected after deducting Meesho product costs from delivered orders.
              </p>
            </div>

            <div className="card p-5 border-l-4 border-l-indigo-600">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Expected Profit Margin</span>
              <div className="text-3xl font-black mt-2 text-indigo-700">
                {formatPrice(dashboard?.total_expected_margin || 0)}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Potential margin across all active and ongoing uncancelled orders.
              </p>
            </div>

            <div className="card p-5 border-l-4 border-l-emerald-600">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Delivered Orders Cash Inflow</span>
              <div className="text-3xl font-black mt-2 text-emerald-700">
                {formatPrice(dashboard?.total_sales || 0)}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Gross COD collections from completed deliveries.
              </p>
            </div>
          </div>

          {/* Business Insights Callout */}
          <div className="card p-5 bg-purple-50/40 border border-purple-200">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 mb-2">Reseller Margin Formula</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="font-bold text-gray-900 block mb-1">Expected Margin</span>
                <code>Selling Price − Estimated Product Cost</code>
              </div>
              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="font-bold text-gray-900 block mb-1">Actual Realized Profit</span>
                <code>Collected Revenue − Actual Meesho Cost − Any Deductions</code>
              </div>
            </div>
          </div>

          {/* Detailed per-order Profit Ledger */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Per-Order Margin Ledger</h2>
                <p className="text-xs text-gray-400 mt-0.5">Individual profitability breakdown by order</p>
              </div>
              <span className="text-xs font-bold text-gray-500">{report.length} entries recorded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4">Customer Selling Price</th>
                    <th className="py-3 px-4">Meesho Purchase Cost</th>
                    <th className="py-3 px-4">Actual Net Profit</th>
                    <th className="py-3 px-4 text-right">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No financial records found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    report.map(r => (
                      <tr key={r.order_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-gray-900 block">{r.order_id}</span>
                          <span className="text-[11px] text-gray-400">{formatDate(r.created_at)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusInfo(r.status).color}`}>
                            {getStatusInfo(r.status).label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {formatPrice(r.selling_price)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-600">
                          {r.purchase_cost !== null ? (
                            <span>{formatPrice(r.purchase_cost)}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not entered yet</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {['CANCELLED', 'RETURNED'].includes(r.status) ? (
                            <span className="text-red-500 font-bold">₹0 (Cancelled)</span>
                          ) : r.actual_profit !== null ? (
                            <span className={`font-black ${r.actual_profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {r.actual_profit >= 0 ? '+' : ''}{formatPrice(r.actual_profit)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pending delivery</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {r.is_meesho_ordered ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              <CheckCircle2 className="w-3 h-3" /> Ordered
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Unfulfilled
                            </span>
                          )}
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

