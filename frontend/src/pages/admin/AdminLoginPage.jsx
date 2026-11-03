import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Store, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success('Welcome back, Admin!')
      navigate('/admin/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password'
      toast.error(typeof msg === 'string' ? msg : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-brand">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">ShopEzy Seller Portal</h1>
          <p className="text-xs text-gray-400 mt-1">Authorized Store Owner Access Only</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-7 shadow-2xl border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Admin Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@shopezy.com"
                  className="input-field pl-9 text-xs"
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="label">Admin Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-9 text-xs"
                  required
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-brand"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>Sign In to Seller Panel <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Encrypted Admin Session</span>
          </div>
        </div>

        {/* Quick hint for initial setup */}
        <div className="text-center mt-4">
          <span className="text-[11px] text-gray-400 bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-700">
            Default credentials: <strong className="text-gray-200">admin@shopezy.com</strong> / <strong className="text-gray-200">admin123</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

