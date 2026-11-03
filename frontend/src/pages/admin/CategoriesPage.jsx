import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tag, Eye, EyeOff, Check, X } from 'lucide-react'
import { categoriesAPI } from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('shirt')
  const [sortOrder, setSortOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await categoriesAPI.getAll(false)
      setCategories(res.data || [])
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openCreateModal = () => {
    setEditingCat(null)
    setName('')
    setIcon('shirt')
    setSortOrder(String(categories.length))
    setIsActive(true)
    setModalOpen(true)
  }

  const openEditModal = (cat) => {
    setEditingCat(cat)
    setName(cat.name)
    setIcon(cat.icon || 'shirt')
    setSortOrder(String(cat.sort_order ?? 0))
    setIsActive(cat.is_active ?? true)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        icon,
        sort_order: parseInt(sortOrder) || 0,
        is_active: isActive
      }
      if (editingCat) {
        await categoriesAPI.update(editingCat.id, payload)
        toast.success('Category updated successfully')
      } else {
        await categoriesAPI.create(payload)
        toast.success('Category created successfully')
      }
      setModalOpen(false)
      fetchCategories()
    } catch (err) {
      toast.error('Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return
    try {
      await categoriesAPI.delete(cat.id)
      toast.success('Category deleted')
      fetchCategories()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Category Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Organize store products into logical shopping sections</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary text-xs py-2.5 px-4 font-bold inline-flex items-center gap-1.5 self-start sm:self-auto shadow-brand"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-gray-700">No Categories Found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Sort Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Slug (URL)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-500">#{c.sort_order}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">/category/{c.slug}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-gray-600"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Create New Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="label">Category Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Winter Wear"
              className="input-field text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="label">Icon Style</label>
            <select
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="input-field text-xs"
            >
              <option value="shirt">Shirt / Fashion</option>
              <option value="dress">Dress / Women</option>
              <option value="baby">Baby / Kids</option>
              <option value="footwear">Footwear</option>
              <option value="watch">Accessories / Watch</option>
              <option value="home">Home & Kitchen</option>
              <option value="sparkles">Beauty & Lifestyle</option>
            </select>
          </div>

          <div>
            <label className="label">Sort Priority Index</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <span className="font-bold text-gray-800">Active in Storefront</span>
          </label>

          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 py-2.5 text-xs font-bold"
            >
              {submitting ? <LoadingSpinner size="sm" color="white" /> : 'Save Category'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-outline text-xs px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

