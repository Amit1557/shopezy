import { initializeApp, getApps } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCJTBmbtli7Y05g3KeFSrQSKz7yu8eql2o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shopezy-4764d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shopezy-4764d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shopezy-4764d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "941615059982",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:941615059982:web:6bf1d6d4816d3f7ccb185f"
}

let app
let auth

export function getFirebaseAuth() {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    auth = getAuth(app)
  }
  return auth
}

export function clearRecaptcha() {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear()
    } catch (e) {
      console.warn('Error clearing recaptchaVerifier:', e)
    }
    window.recaptchaVerifier = null
  }
  const oldContainer = document.getElementById('firebase-recaptcha-anchor')
  if (oldContainer) {
    oldContainer.remove()
  }
}

export function setupRecaptcha() {
  const authInstance = getFirebaseAuth()
  
  // 1. Wipe out any existing verifier and old DOM element completely
  clearRecaptcha()

  // 2. Create a fresh, pristine container element so reCAPTCHA never sees a previous render
  const container = document.createElement('div')
  container.id = 'firebase-recaptcha-anchor'
  document.body.appendChild(container)

  window.recaptchaVerifier = new RecaptchaVerifier(authInstance, container, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      clearRecaptcha()
    }
  })

  return window.recaptchaVerifier
}

export async function sendFirebaseOtp(mobileNumber) {
  const authInstance = getFirebaseAuth()
  const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10)
  if (cleanMobile.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number')
  }
  const fullMobile = `+91${cleanMobile}`
  const appVerifier = setupRecaptcha()

  try {
    const confirmationResult = await signInWithPhoneNumber(authInstance, fullMobile, appVerifier)
    window.confirmationResult = confirmationResult
    return { success: true, confirmationResult }
  } catch (error) {
    console.error('Firebase SMS send error details:', error)
    clearRecaptcha()
    throw error
  }
}

export async function verifyFirebaseOtp(verificationCode) {
  if (!window.confirmationResult) {
    throw new Error('Please request an OTP code first.')
  }
  const result = await window.confirmationResult.confirm(verificationCode)
  return result.user
}
