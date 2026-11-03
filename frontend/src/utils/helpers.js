export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatDateShort(dateString) {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export const ORDER_STATUSES = {
  NEW: { label: 'Order Placed', color: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700' },
  MEESHO_ORDERED: { label: 'Ordered from Meesho', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: 'Shipped', color: 'bg-orange-100 text-orange-700' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-yellow-100 text-yellow-700' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  RETURN_REQUESTED: { label: 'Return Requested', color: 'bg-pink-100 text-pink-700' },
  RETURNED: { label: 'Returned', color: 'bg-gray-100 text-gray-600' },
  FAILED_DELIVERY: { label: 'Delivery Failed', color: 'bg-red-100 text-red-700' },
}

export function getStatusInfo(status) {
  return ORDER_STATUSES[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
}

export function validateMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile)
}

export function validatePincode(pincode) {
  return /^\d{6}$/.test(pincode)
}

export function truncate(str, length = 60) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function calcDiscount(original, selling) {
  if (!original || original <= selling) return 0
  return Math.round(((original - selling) / original) * 100)
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]
