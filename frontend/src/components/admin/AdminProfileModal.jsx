import { useState, useEffect } from 'react'
import { X, User, Mail, Lock, ShieldCheck, Key, Save, CheckCircle } from 'lucide-react'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminProfileModal({ isOpen, onClose }) {
  const { admin, updateAdminInfo } = useAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && admin) {
      setName(admin.name || '')
      setEmail(admin.email || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [isOpen, admin])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Store Owner name is required')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error('Please enter your current password to authorize this password change')
        return
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters')
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('New password and confirm password do not match')
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      }
      if (newPassword) {
        payload.current_password = currentPassword
        payload.new_password = newPassword
      }

      const res = await authAPI.updateAdminProfile(payload)
      const data = res.data

      // Update auth context with new email/name and new token
      updateAdminInfo(
        { email: data.admin.email, name: data.admin.name },
        data.access_token
      )

      toast.success('🎉 Admin profile & login credentials updated successfully!')
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to update admin profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-100 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-brand-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-black text-base">Store Owner Settings</h2>
              <p className="text-[11px] text-purple-100">Change Admin Name, Login Email & Password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Admin Name */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-600" />
              Owner / Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Amit Kumar"
              className="input-field text-xs font-semibold"
              required
            />
          </div>

          {/* Admin Email */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-600" />
              Admin Login Email ID
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your-custom-email@gmail.com"
              className="input-field text-xs font-semibold"
              required
            />
            <p className="text-[10px] text-gray-400">
              You will use this email to log in to your Admin Dashboard.
            </p>
          </div>

          {/* Change Password Divider */}
          <div className="pt-2 border-t border-gray-100">
            <span className="font-black text-gray-800 flex items-center gap-1.5 pb-2">
              <Key className="w-3.5 h-3.5 text-purple-600" />
              Change Password (Leave blank to keep same)
            </span>

            <div className="space-y-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (e.g. admin123)"
                  className="input-field text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">New Secret Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input-field text-xs bg-white"
                />
              </div>

              {newPassword && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="input-field text-xs bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex gap-2 justify-end border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2.5 px-6 font-black flex items-center gap-1.5 shadow-md shadow-purple-200 cursor-pointer"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
              <span>Save Admin Settings</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
