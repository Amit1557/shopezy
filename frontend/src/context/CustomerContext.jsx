import { createContext, useContext, useState, useEffect } from 'react'
import { customerAuthAPI } from '../services/api'
import toast from 'react-hot-toast'

const CustomerContext = createContext(null)

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('customer_token')
    const savedCustomer = localStorage.getItem('customer_info')

    if (token && savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer))
        // Verify with server in background
        customerAuthAPI.getMe()
          .then(res => {
            setCustomer(res.data)
            localStorage.setItem('customer_info', JSON.stringify(res.data))
          })
          .catch((err) => {
            // Only clear token if server explicitly said 401 Unauthorized
            if (err.response?.status === 401) {
              logoutCustomer()
            }
          })
      } catch {
        logoutCustomer()
      }
    }
    setLoading(false)
  }, [])

  const loginCustomer = async (identifier, password) => {
    try {
      const res = await customerAuthAPI.login({ identifier, password })
      const { access_token, customer: custData } = res.data
      localStorage.setItem('customer_token', access_token)
      localStorage.setItem('customer_info', JSON.stringify(custData))
      setCustomer(custData)
      setAuthModalOpen(false)
      toast.success(`Welcome back, ${custData.name}!`)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check credentials.'
      toast.error(msg)
      throw err
    }
  }

  const registerCustomer = async (formData) => {
    try {
      const res = await customerAuthAPI.register(formData)
      const { access_token, customer: custData } = res.data
      localStorage.setItem('customer_token', access_token)
      localStorage.setItem('customer_info', JSON.stringify(custData))
      setCustomer(custData)
      setAuthModalOpen(false)
      toast.success(`Account created! Welcome to ShopEzy, ${custData.name}!`)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your details.'
      toast.error(msg)
      throw err
    }
  }

  const logoutCustomer = () => {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_info')
    setCustomer(null)
    toast.success('Logged out successfully')
  }

  return (
    <CustomerContext.Provider
      value={{
        customer,
        loading,
        isCustomerLoggedIn: Boolean(customer),
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        loginCustomer,
        registerCustomer,
        logoutCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider')
  return ctx
}

