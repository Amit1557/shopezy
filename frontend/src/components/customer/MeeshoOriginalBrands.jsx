import { CheckCircle2, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react'

const ORIGINAL_BRAND_CATEGORIES = [
  {
    name: 'Personal Care',
    categorySlug: 'beauty-health',
    subcategory: 'Face Creams & Serums',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=350&h=350&q=80',
    tag: 'Daily Care'
  },
  {
    name: 'Electronics',
    categorySlug: 'electronics',
    subcategory: 'Bluetooth Earphones & Neckbands',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=350&h=350&q=80',
    tag: 'Audio & Tech'
  },
  {
    name: 'Makeup',
    categorySlug: 'beauty-health',
    subcategory: 'Lipsticks & Lip Gloss',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=350&h=350&q=80',
    tag: 'Trending'
  },
  {
    name: 'Men Perfume',
    categorySlug: 'beauty-health',
    subcategory: 'Perfumes & Deodorants',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=350&h=350&q=80',
    tag: 'Fragrances'
  },
  {
    name: 'Bags',
    categorySlug: 'jewellery-accessories',
    subcategory: 'Handbags & Clutches',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=350&h=350&q=80',
    tag: 'Fashion Bags'
  },
  {
    name: 'Footwear',
    categorySlug: 'footwear',
    subcategory: 'All Footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=350&h=350&q=80',
    tag: 'Daily Comfort'
  },
  {
    name: 'Watches',
    categorySlug: 'watches',
    subcategory: 'All Watches',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=350&h=350&q=80',
    tag: 'Top Quality'
  }
]

const BRAND_LOGOS = [
  { name: 'W', font: 'font-serif font-black text-2xl tracking-widest text-gray-900', style: 'border border-gray-300 rounded px-3 py-0.5' },
  { name: 'mamaearth', font: 'font-bold tracking-tight text-[#00A5B5] text-sm' },
  { name: 'WILD STONE', font: 'font-black tracking-wider text-gray-900 text-xs uppercase' },
  { name: 'plum', font: 'font-serif font-bold text-[#6D28D9] text-sm' },
  { name: 'NIVEA', font: 'font-black tracking-tight text-[#002D62] text-sm bg-blue-50 px-2 py-0.5 rounded' },
  { name: 'Himalaya', sub: 'SINCE 1930', font: 'font-semibold text-[#008272] text-xs' },
  { name: 'mi', font: 'font-black text-white bg-[#FF6700] px-2 py-0.5 rounded text-xs tracking-tight' },
  { name: 'Bata', font: 'font-serif italic font-extrabold text-[#DC2626] text-sm' },
  { name: 'WOW', sub: 'SKIN SCIENCE', font: 'font-black text-amber-600 text-xs' },
]

export default function MeeshoOriginalBrands({ onSelectFilter }) {
  const handleCardClick = (item) => {
    if (onSelectFilter) {
      onSelectFilter(item.categorySlug, item.subcategory)
    }
    const el = document.getElementById('products-feed')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 sm:p-6 mb-6">
      {/* Top Header - Exact Meesho Style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-1.5">
            <span>Original Brands</span>
            <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </span>
          </h2>
          <span className="hidden sm:inline-block text-[11px] font-bold text-gray-400 border-l border-gray-200 pl-2 ml-1">
            100% Genuine Quality Verified
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleCardClick({ categorySlug: '', subcategory: '' })}
          className="text-xs font-black text-purple-700 hover:text-purple-900 flex items-center gap-0.5 uppercase tracking-wide cursor-pointer transition-colors"
        >
          <span>VIEW ALL</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 7 Original Brands Category Cards - Exact Meesho Visuals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-3.5">
        {ORIGINAL_BRAND_CATEGORIES.map((item) => (
          <div
            key={item.name}
            onClick={() => handleCardClick(item)}
            className="group cursor-pointer flex flex-col justify-between rounded-2xl border border-purple-100/80 bg-gradient-to-b from-[#F3F4F6]/70 via-[#F8FAFC] to-white p-2.5 hover:shadow-md hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            {/* Product Picture */}
            <div className="w-full aspect-square rounded-xl bg-white overflow-hidden flex items-center justify-center p-2 shadow-xs group-hover:scale-105 transition-transform duration-300">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            {/* Bottom Purple Pill */}
            <button
              type="button"
              className="mt-2.5 w-full bg-gradient-to-r from-purple-700 to-indigo-700 group-hover:from-purple-800 group-hover:to-indigo-800 text-white font-extrabold text-[11px] sm:text-xs py-1.5 px-2 rounded-xl text-center shadow-xs transition-colors duration-200 truncate cursor-pointer"
            >
              {item.name}
            </button>
          </div>
        ))}
      </div>

      {/* Brand Logos Footer Strip - Exact Meesho Brand Ribbon */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 sm:gap-6 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {BRAND_LOGOS.map((brand, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-1.5 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-200 cursor-pointer"
            onClick={() => handleCardClick({ categorySlug: '', subcategory: brand.name })}
          >
            <span className={brand.font}>{brand.name}</span>
            {brand.sub && (
              <span className="text-[8px] font-bold tracking-wider text-gray-400 uppercase -mt-0.5">
                {brand.sub}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
