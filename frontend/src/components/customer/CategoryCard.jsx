import { Link } from 'react-router-dom'

const DEFAULT_CATEGORY_IMAGES = {
  'kurti-saree-lehenga': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&h=300&q=80',
  'ethnic-wear': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&h=300&q=80',
  'women-western': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=300&h=300&q=80',
  'western-dresses': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=300&h=300&q=80',
  'womens-fashion': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=300&h=300&q=80',
  'lingerie': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&h=300&q=80',
  'men': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&h=300&q=80',
  'menswear': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&h=300&q=80',
  'mens-fashion': 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&h=300&q=80',
  'kids-toys': 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=300&h=300&q=80',
  'kids-fashion': 'https://images.unsplash.com/photo-1503944570028-3e4b7b25852b?auto=format&fit=crop&w=300&h=300&q=80',
  'home-kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80',
  'home-decor': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80',
  'beauty-health': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&h=300&q=80',
  'beauty': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&h=300&q=80',
  'beauty-lifestyle': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&h=300&q=80',
  'jewellery-accessories': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&h=300&q=80',
  'accessories': 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=300&h=300&q=80',
  'bags-footwear': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&h=300&q=80',
  'footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&h=300&q=80',
  'electronics': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&h=300&q=80',
  'watches': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=300&h=300&q=80',
  'sports-fitness': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&h=300&q=80',
}

export function getCategoryPhoto(category) {
  if (category.image_url && category.image_url.startsWith('http')) {
    return category.image_url
  }
  if (category.slug && DEFAULT_CATEGORY_IMAGES[category.slug]) {
    return DEFAULT_CATEGORY_IMAGES[category.slug]
  }
  const name = (category.name || '').toLowerCase()
  if (name.includes('saree') || name.includes('kurti') || name.includes('lehenga') || name.includes('ethnic')) {
    return DEFAULT_CATEGORY_IMAGES['kurti-saree-lehenga']
  }
  if (name.includes('western') || name.includes('dress')) {
    return DEFAULT_CATEGORY_IMAGES['women-western']
  }
  if (name.includes('watch')) return DEFAULT_CATEGORY_IMAGES['watches']
  if (name.includes('footwear') || name.includes('shoe') || name.includes('sneaker')) return DEFAULT_CATEGORY_IMAGES['footwear']
  if (name.includes('jewel') || name.includes('necklace') || name.includes('earring')) return DEFAULT_CATEGORY_IMAGES['jewellery-accessories']
  if (name.includes('men')) return DEFAULT_CATEGORY_IMAGES['mens-fashion']
  if (name.includes('women')) return DEFAULT_CATEGORY_IMAGES['womens-fashion']
  if (name.includes('beauty') || name.includes('cosmetic') || name.includes('health')) return DEFAULT_CATEGORY_IMAGES['beauty-health']
  if (name.includes('kitchen') || name.includes('home')) return DEFAULT_CATEGORY_IMAGES['home-kitchen']
  if (name.includes('kid') || name.includes('toy') || name.includes('baby')) return DEFAULT_CATEGORY_IMAGES['kids-toys']
  if (name.includes('electr') || name.includes('phone') || name.includes('gadget')) return DEFAULT_CATEGORY_IMAGES['electronics']
  if (name.includes('lingerie') || name.includes('nightwear')) return DEFAULT_CATEGORY_IMAGES['lingerie']
  if (name.includes('bag')) return DEFAULT_CATEGORY_IMAGES['bags-footwear']
  return DEFAULT_CATEGORY_IMAGES['kurti-saree-lehenga']
}

export default function CategoryCard({ category, index = 0 }) {
  const photo = getCategoryPhoto(category)

  return (
    <Link
      to={`/category/${category.slug}`}
      className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer p-1 transition-transform duration-200 hover:-translate-y-1 flex-shrink-0"
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
        <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
          <img
            src={photo}
            alt={category.name}
            loading="lazy"
            className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-gray-800 text-center leading-tight line-clamp-1 max-w-[70px] sm:max-w-[85px] md:max-w-[100px] group-hover:text-purple-700 transition-colors">
        {category.name}
      </span>
    </Link>
  )
}
