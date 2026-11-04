import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, Phone, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react'
import { sendFirebaseOtp, verifyFirebaseOtp } from '../../services/firebase'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function CheckoutOtpModal({ isOpen, onClose, mobile, onVerified }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(45)
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]

  // When modal opens, send OTP automatically
  useEffect(() => {
    if (isOpen && mobile) {
      setDigits(['', '', '', '', '', ''])
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
      // Send real 6-digit SMS via Google Firebase Phone Auth directly to SIM
      await sendFirebaseOtp(mobile)
      toast.success(`6-digit SMS verification code sent to +91 ${mobile}`)
      setCountdown(45)
      setTimeout(() => inputRefs[0]?.current?.focus(), 200)
    } catch (firebaseErr) {
      console.error('Firebase Phone Auth error:', firebaseErr)
      const errCode = firebaseErr.code || ''
      if (errCode === 'auth/invalid-phone-number') {
        toast.error('Invalid mobile number. Please check your 10-digit number.')
      } else if (errCode === 'auth/quota-exceeded') {
        toast.error("Today's SMS quota reached in Firebase free tier. Please try after some time.")
      } else if (errCode === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please wait 1 minute before trying again.')
      } else if (errCode === 'auth/captcha-check-failed') {
        toast.error('reCAPTCHA security check failed. Please refresh and try again.')
      } else {
        toast.error(firebaseErr.message || 'Unable to send SMS. Please verify your mobile number.')
      }
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
      const pasteDigits = cleanVal.slice(0, 6).split('')
      const newDigits = [...digits]
      pasteDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d
      })
      setDigits(newDigits)
      const nextIdx = Math.min(pasteDigits.length, 5)
      inputRefs[nextIdx]?.current?.focus()
      return
    }

    const newDigits = [...digits]
    newDigits[index] = cleanVal
    setDigits(newDigits)

    // Move to next input
    if (index < 5 && cleanVal) {
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
    const enteredCode = digits.join('').trim()
    if (enteredCode.length !== 6) {
      toast.error('Please enter the full 6-digit OTP received via SMS')
      return
    }

    setVerifying(true)
    try {
      // Verify with Google Firebase
      await verifyFirebaseOtp(enteredCode)
      toast.success('Mobile verified successfully via Google SMS!')
      onVerified()
    } catch (err) {
      console.error('Firebase verification error:', err)
      const errCode = err.code || ''
      if (errCode === 'auth/invalid-verification-code') {
        toast.error('Incorrect OTP. Please check the SMS on your phone and try again.')
      } else if (errCode === 'auth/code-expired') {
        toast.error('OTP code has expired. Please click "Resend Code via SMS".')
      } else {
        toast.error(err.message || 'Invalid verification code. Please check your SMS and try again.')
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-4 sm:p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-emerald-200">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-gray-900">COD Mobile Verification</h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
            We sent a 6-digit verification code to your mobile phone
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold font-mono text-gray-800 mt-1.5">
            <Phone className="w-3 h-3 text-emerald-600" />
            +91 {mobile}
          </div>
        </div>

        {/* Status notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 mb-4 sm:mb-5 text-center flex items-center justify-center gap-1.5 sm:gap-2">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-900">
            Official SMS sent to your SIM! Please enter the 6-digit code below.
          </p>
        </div>

        {/* 6-digit input fields */}
        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-5">
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
                className="w-9 sm:w-10 h-11 sm:h-12 text-center text-lg sm:text-xl font-black rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-gray-800 font-mono shadow-xs"
              />
            ))}
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={verifying || digits.join('').trim().length !== 6}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {verifying ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Verifying Code...</span>
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
            <span>Resend SMS in <strong className="text-emerald-700 font-mono">{countdown}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sending}
              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${sending ? 'animate-spin' : ''}`} />
              Resend Code via SMS
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
