import { Link } from 'react-router-dom'
import { ShoppingBag, Shirt, Baby, Footprints, Watch, Home, Sparkles } from 'lucide-react'

const ICONS = {
  shirt: Shirt,
  dress: Shirt,
  baby: Baby,
  footwear: Footprints,
  watch: Watch,
  home: Home,
  sparkles: Sparkles,
}

const CAT_COLORS = [
  'from-purple-100 to-purple-50',
  'from-pink-100 to-pink-50',
  'from-blue-100 to-blue-50',
  'from-orange-100 to-orange-50',
  'from-green-100 to-green-50',
  'from-yellow-100 to-yellow-50',
  'from-red-100 to-red-50',
]

export default function CategoryCard({ category, index = 0 }) {
  const Icon = ICONS[category.icon] || ShoppingBag
  const gradient = CAT_COLORS[index % CAT_COLORS.length]

  return (
    <Link
      to={`/category/${category.slug}`}
      className="flex flex-col items-center gap-2 p-3 group cursor-pointer"
    >
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:shadow-md transition-shadow duration-200`}>
        {category.image_url ? (
          <img src={category.image_url} alt={category.name} className="w-10 h-10 object-contain" />
        ) : (
          <Icon className="w-8 h-8 text-brand-600" />
        )}
      </div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{category.name}</span>
    </Link>
  )
}
