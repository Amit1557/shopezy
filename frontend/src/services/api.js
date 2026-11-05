import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach appropriate token (admin or customer) for authenticated requests
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('admin_token')
  const customerToken = localStorage.getItem('customer_token')

  const url = config.url || ''
  const isCustomerEndpoint =
    url.startsWith('/auth/customer') ||
    url.startsWith('/orders/my-orders') ||
    url.startsWith('/orders/cancel') ||
    url.startsWith('/orders/request-return')

  if (isCustomerEndpoint) {
    if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    }
  } else if (url.startsWith('/admin') || url.includes('/admin/')) {
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    }
  } else {
    // Default fallback
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    } else if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`
    }
  }

  return config
})

// Handle 401 - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute = window.location.pathname.startsWith('/admin')
      if (isAdminRoute) {
        localStorage.removeItem('admin_token')
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getAdminProfile: () => api.get('/auth/me'),
  updateAdminProfile: (data) => api.put('/auth/admin/profile', data),
  sendOtp: (mobile) => api.post('/auth/otp/send', { mobile }),
  verifyOtp: (mobile, otp) => api.post('/auth/otp/verify', { mobile, otp }),
}

// Categories
export const categoriesAPI = {
  getAll: (activeOnly = true) => api.get(`/categories/?active_only=${activeOnly}`),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Products - Public
export const productsPublicAPI = {
  getAll: (params) => api.get('/products/public', { params }),
  getBySlug: (slug) => api.get(`/products/public/${slug}`),
  addReview: (productId, data) => api.post(`/products/public/${productId}/reviews`, data),
}

// Products - Admin
export const productsAdminAPI = {
  getAll: (params) => api.get('/products/admin', { params }),
  getById: (id) => api.get(`/products/admin/${id}`),
  create: (data) => api.post('/products/admin', data),
  update: (id, data) => api.put(`/products/admin/${id}`, data),
  delete: (id) => api.delete(`/products/admin/${id}`),
  addImage: (id, imageUrl, isPrimary) => api.post(`/products/admin/${id}/images`, null, { params: { image_url: imageUrl, is_primary: isPrimary } }),
  deleteImage: (productId, imageId) => api.delete(`/products/admin/${productId}/images/${imageId}`),
  updateVariants: (id, variants) => api.post(`/products/admin/${id}/variants`, variants),
  uploadImage: (formData) => api.post('/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  parseMeesho: (data) => api.post('/products/parse-meesho', data),
  quickPublish: (data) => api.post('/products/quick-publish', data),
  bulkPublish: (data) => api.post('/products/bulk-publish', data),
  bulkParseMeesho: (data) => api.post('/products/bulk-parse-meesho', data),
  backupAll: () => api.get('/products/admin/backup-all'),
  restoreAll: (data) => api.post('/products/admin/restore-all', data),
}

// Customer Auth
export const customerAuthAPI = {
  register: (data) => api.post('/auth/customer/register', data),
  login: (data) => api.post('/auth/customer/login', data),
  getMe: () => api.get('/auth/customer/me'),
}

// Orders - Public
export const ordersPublicAPI = {
  place: (data) => api.post('/orders/place', data),
  track: (orderId, mobile) => api.get('/orders/track', { params: { order_id: orderId, mobile } }),
  getMyOrders: (mobile) => api.get('/orders/my-orders', { params: { mobile } }),
  cancel: (data) => api.post('/orders/cancel', data),
  requestReturn: (data) => api.post('/orders/request-return', data),
}

// Orders - Admin
export const ordersAdminAPI = {
  getAll: (params) => api.get('/orders/admin', { params }),
  getById: (orderId) => api.get(`/orders/admin/${orderId}`),
  updateStatus: (orderId, status, note) => api.put(`/orders/admin/${orderId}/status`, { status, note }),
  updateNotes: (orderId, notes) => api.put(`/orders/admin/${orderId}/notes`, null, { params: { notes } }),
  updateMeesho: (orderId, data) => api.put(`/orders/admin/${orderId}/meesho`, data),
  returnAction: (orderId, data) => api.put(`/orders/admin/${orderId}/return-action`, data),
}

// Analytics - Admin
export const analyticsAPI = {
  getDashboard: (period, dateFrom, dateTo) => api.get('/analytics/dashboard', { params: { period, date_from: dateFrom, date_to: dateTo } }),
  getProfitReport: (period) => api.get('/analytics/profit-report', { params: { period } }),
  getCustomers: (params) => api.get('/analytics/customers', { params }),
  getCustomerDetail: (id) => api.get(`/analytics/customers/${id}`),
}

export default api
