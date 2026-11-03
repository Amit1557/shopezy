import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, Phone, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react'
import { authAPI } from '../../services/api'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function CheckoutOtpModal({ isOpen, onClose, mobile, onVerified }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [demoOtp, setDemoOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // When modal opens, send OTP automatically
  useEffect(() => {
    if (isOpen && mobile) {
      setDigits(['', '', '', ''])
      handleSendOtp()
    }
  }, [isOpen, mobile])

  // Countdown timer for resend
  useEffect(() => {
    if (!isOpen || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, countdown])

  if (!isOpen) return null

  const handleSendOtp = async () => {
    setSending(true)
    try {
      const res = await authAPI.sendOtp(mobile)
      if (res.data?.demo_otp) {
        setDemoOtp(res.data.demo_otp)
      }
      setCountdown(30)
      toast.success(`Verification code sent to +91 ${mobile}`)
      setTimeout(() => inputRefs[0]?.current?.focus(), 100)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to send OTP code. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleDigitChange = (index, val) => {
    const cleanVal = val.replace(/\D/g, '')
    if (!cleanVal) {
      const newDigits = [...digits]
      newDigits[index] = ''
      setDigits(newDigits)
      return
    }

    // If pasted multiple digits
    if (cleanVal.length > 1) {
      const pasteDigits = cleanVal.slice(0, 4).split('')
      const newDigits = [...digits]
      pasteDigits.forEach((d, i) => {
        if (i < 4) newDigits[i] = d
      })
      setDigits(newDigits)
      const nextIdx = Math.min(pasteDigits.length, 3)
      inputRefs[nextIdx]?.current?.focus()
      return
    }

    const newDigits = [...digits]
    newDigits[index] = cleanVal
    setDigits(newDigits)

    // Move to next input
    if (index < 3 && cleanVal) {
      inputRefs[index + 1]?.current?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus()
    }
  }

  const handleVerify = async (e) => {
    if (e) e.preventDefault()
    const enteredOtp = digits.join('')
    if (enteredOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit OTP code')
      return
    }

    setVerifying(true)
    try {
      await authAPI.verifyOtp(mobile, enteredOtp)
      toast.success('Mobile verified successfully!')
      onVerified()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Invalid verification code. Try demo code 1234')
    } finally {
      setVerifying(false)
    }
  }

  // Quick auto-fill helper for test/demo OTP
  const fillCode = (code) => {
    const parts = code.split('').slice(0, 4)
    setDigits(parts)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-green-200">
            <ShieldCheck className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-lg font-black text-gray-900">COD Mobile Verification</h2>
          <p className="text-xs text-gray-500 mt-1">
            We sent a 4-digit verification code to
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold font-mono text-gray-800 mt-1.5">
            <Phone className="w-3 h-3 text-green-600" />
            +91 {mobile}
          </div>
        </div>

        {/* Demo OTP Banner for Easy Testing */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-5 text-center">
          <div className="text-[11px] font-bold text-purple-900 flex items-center justify-center gap-1">
            <span>✨ Test Demo OTP:</span>
            <button
              type="button"
              onClick={() => fillCode(demoOtp || '1234')}
              className="font-mono bg-purple-600 text-white px-2 py-0.5 rounded text-xs hover:bg-purple-700 transition-colors cursor-pointer"
              title="Click to auto-fill"
            >
              {demoOtp || '1234'}
            </button>
          </div>
          <p className="text-[10px] text-purple-700 mt-0.5">
            (Universal test code <strong className="font-mono">1234</strong> is also accepted)
          </p>
        </div>

        {/* 4-digit input inputs */}
        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-3 mb-5">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-2xl font-black rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-gray-800 font-mono shadow-sm"
              />
            ))}
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={verifying || digits.join('').length !== 4}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm rounded-xl shadow-brand disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Verify & Place COD Order</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Timer */}
        <div className="text-center mt-4 text-xs text-gray-500">
          {countdown > 0 ? (
            <span>Resend code in <strong className="text-brand-600 font-mono">{countdown}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sending}
              className="text-brand-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${sending ? 'animate-spin' : ''}`} />
              Resend OTP Code
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

