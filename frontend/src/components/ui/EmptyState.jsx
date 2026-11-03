import { ShoppingBag } from 'lucide-react'

export default function EmptyState({ icon: Icon = ShoppingBag, title = 'Nothing here yet', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-brand-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-6 max-w-xs">{description}</p>}
      {action && action}
    </div>
  )
}
