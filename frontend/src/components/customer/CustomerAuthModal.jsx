import { useState } from 'react'
import {
  X, User, Phone, Lock, Mail, ArrowRight, ShieldCheck,
  CheckCircle, Sparkles, AlertCircle
} from 'lucide-react'
import { useCustomer } from '../../context/CustomerContext'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function CustomerAuthModal() {
  const { authModalOpen, closeAuthModal, loginCustomer, registerCustomer } = useCustomer()

  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('') // mobile or email
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!authModalOpen) return null

  const resetForm = () => {
    setError('')
    setName('')
    setIdentifier('')
    setMobile('')
    setEmail('')
    setPassword('')
  }

  const handleClose = () => {
    resetForm()
    closeAuthModal()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const raw = identifier.trim()
        if (!raw) throw new Error('Please enter your mobile number or email')
        if (!password) throw new Error('Please enter your password')

        let identToSend = raw
        if (!raw.includes('@')) {
          const digits = raw.replace(/[^0-9]/g, '')
          if (digits.length >= 10) {
            identToSend = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10)
          }
        }
        await loginCustomer(identToSend, password)
      } else {
        if (!name.trim()) throw new Error('Please enter your full name')
        const rawDigits = mobile.replace(/[^0-9]/g, '')
        const cleanPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : (rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits)
        if (cleanPhone.length !== 10) throw new Error('Please enter a valid 10-digit mobile number')
        if (!password || password.length < 4) throw new Error('Password must be at least 4 characters')
        await registerCustomer({
          name: name.trim(),
          mobile: cleanPhone,
          email: email.trim() || undefined,
          password
        })
      }
      handleClose()
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Incorrect mobile number or password. If you are a new customer, please click "New Customer? Sign Up".')
      } else {
        setError(err.response?.data?.detail || err.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-100 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 via-purple-700 to-brand-600 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </span>
            <span className="text-xs uppercase tracking-wider font-extrabold text-purple-200">ShopEzy Account</span>
          </div>
          <h2 className="text-xl font-black">
            {mode === 'login' ? 'Welcome Back!' : 'Create Customer Account'}
          </h2>
          <p className="text-xs text-purple-200 mt-1">
            {mode === 'login'
              ? 'Log in to view your orders, request easy returns & track deliveries.'
              : 'Sign up to place COD orders, manage past purchases & enjoy 7-day returns.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); resetForm() }}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In / Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); resetForm() }}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            New Customer? Sign Up
          </button>
        </div>

        {/* Form Body - Disables browser password autofill completely */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
          autoComplete="off"
          spellCheck="false"
          autoCapitalize="off"
        >
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-xs flex items-center gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  name="shopezy_cust_reg_name"
                  id="shopezy_cust_reg_name"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="input-field pl-9 text-xs"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {mode === 'login' ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Mobile Number or Email *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  name="shopezy_cust_login_ident"
                  id="shopezy_cust_login_ident"
                  autoComplete="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter 10-digit mobile or email..."
                  className="input-field pl-9 text-xs"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Mobile Number (10 Digits) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    name="shopezy_cust_reg_mobile"
                    id="shopezy_cust_reg_mobile"
                    autoComplete="off"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="input-field pl-12 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Email Address (Optional)</label>
                <div className="relative">
                  <input
                    type="email"
                    name="shopezy_cust_reg_email"
                    id="shopezy_cust_reg_email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input-field pl-9 text-xs"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Password *</label>
            <div className="relative">
              <input
                type="password"
                required
                name={mode === 'login' ? 'shopezy_cust_login_pwd' : 'shopezy_cust_reg_pwd'}
                id={mode === 'login' ? 'shopezy_cust_login_pwd' : 'shopezy_cust_reg_pwd'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters..."
                className="input-field pl-9 text-xs"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-xs py-3 font-black shadow-brand flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Account' : 'Create My Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Benefits highlight */}
          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Easy 7-Day Returns</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>100% Cash on Delivery</span>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}

