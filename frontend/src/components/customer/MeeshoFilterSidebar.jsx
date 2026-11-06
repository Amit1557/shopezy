import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, X, Star, Sparkles } from 'lucide-react'

const PRICE_PRESETS = [
  { label: 'Under ₹299', min: null, max: 299 },
  { label: '₹300 - ₹499', min: 300, max: 499 },
  { label: '₹500 - ₹799', min: 500, max: 799 },
  { label: '₹800 & Above', min: 800, max: null },
]

const GENDER_OPTIONS = ['Men', 'Women', 'Kids', 'Girls', 'Boys', 'Unisex']

const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size']
const FOOTWEAR_SIZES = ['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10']

const POPULAR_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF', border: true },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Grey', hex: '#6B7280' },
]

const RATING_OPTIONS = [
  { label: '4.0 ★ & Above', value: '4.0' },
  { label: '3.5 ★ & Above', value: '3.5' },
  { label: '3.0 ★ & Above', value: '3.0' },
]

const DISCOUNT_OPTIONS = [
  { label: '10% and above', value: '10' },
  { label: '20% and above', value: '20' },
  { label: '30% and above', value: '30' },
  { label: '50% and above', value: '50' },
]

// Category-specific subcategories for Meesho search refinement
const KIDS_TOYS_SUBCATEGORIES = [
  'Dress Up & Pretend Play',
  'Kids Baby & Toddler Toys',
  'Kids Toys',
  'Soft Toys',
  'Toy Vehicles',
  'Toys',
  'Clay & Slime',
  'Educational Toys',
  'Board Games',
  'Play Tents',
  'Baby Mattresses',
]

const HOME_KITCHEN_SUBCATEGORIES = [
  'Bedsheets',
  'Mattress Protectors',
  'Wall Clocks',
  'Door & Window Curtains',
  'Cookware & Utensils',
  'Kitchen Containers',
  'Fancy Clocks',
  'Aprons',
  'Doormats',
]

const ACCESSORIES_BELTS_SUBCATEGORIES = [
  'Women Belts',
  'Men Belts',
  'Waist Belts',
  'Handbags & Clutches',
  'Sling Bags',
  'Wallets',
  'Sunglasses & Frames',
  'Fashion Jewellery',
]

const WOMEN_WESTERN_SUBCATEGORIES = [
  'Western Dresses',
  'Tops & Tunics',
  'Women Jeans',
  'Women Belts',
  'Jumpsuits & Gowns',
  'Skirts & Shorts',
  'Crop Tops',
]

const WATCH_SUBCATEGORIES = [
  'Analog Watches',
  'Chronograph Watches',
  'Digital Watches',
  'Kids Watches',
  'Men Analog Watches',
  'Men Sports Watches',
  'Men Watches',
  'Smartwatches',
]

const FOOTWEAR_SUBCATEGORIES = [
  'Flip Flops',
  'Slippers',
  'Casual Shoes',
  'Sports Shoes',
  'Sneakers',
  'Running Shoes',
  'Sandals & Floaters',
  'Loafers',
]

const JEANS_SUBCATEGORIES = [
  'Jeans',
  'Men Jeans',
  'Slim Fit Jeans',
  'Straight Fit Jeans',
  'Washed Denim',
]

const KURTI_SAREE_SUBCATEGORIES = [
  'Cotton Kurtis',
  'Anarkali Kurtis',
  'Rayon Kurtis',
  'Cotton Sarees',
  'Georgette Sarees',
  'Silk Sarees',
]

const WATCH_DIAL_SHAPES = ['Round', 'Square', 'Rectangle']
const WATCH_STRAP_MATERIALS = ['Stainless Steel', 'Leather', 'Silicon', 'Metal']
const APPAREL_FABRICS = ['Cotton', 'Georgette', 'Denim', 'Silk', 'Rayon', 'Polyester']

export default function MeeshoFilterSidebar({
  categories = [],
  activeCategorySlug = '',
  totalProducts = 0,
  searchParams,
  updateParam,
  clearAllFilters,
  onCloseMobile,
}) {
  const [catSearch, setCatSearch] = useState('')

  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState({
    category: true,
    gender: true,
    price: true,
    size: true,
    color: true,
    dialShape: true,
    strap: true,
    fabric: true,
    rating: false,
    discount: false,
    assurance: false,
  })

  // URL query params
  const searchQuery = (searchParams.get('search') || '').toLowerCase()
  const currentSlug = (activeCategorySlug || '').toLowerCase()
  const context = `${searchQuery} ${currentSlug}`

  // Context Detection (smart Meesho filtering)
  const isKids = context.includes('kid') || context.includes('baby') || context.includes('toy') || context.includes('toddler') || context.includes('stuffed') || context.includes('clay') || context.includes('slime') || context.includes('summer pick')
  const isWatch = context.includes('watch') || context.includes('clock')
  const isElectronics = context.includes('electronic') || context.includes('audio') || context.includes('earbud') || context.includes('headphone') || context.includes('charger') || context.includes('speaker') || context.includes('gadget')
  const isAccessories = context.includes('belt') || context.includes('jewel') || context.includes('accessori') || context.includes('ring') || context.includes('necklace') || context.includes('bangle') || context.includes('earring') || context.includes('sunglass') || context.includes('wallet')
  const isHomeKitchen = context.includes('home') || context.includes('kitchen') || context.includes('chopper') || context.includes('bedsheet') || context.includes('bottle') || context.includes('mattress') || context.includes('curtain') || context.includes('cookware')
  const isBeauty = context.includes('beauty') || context.includes('health') || context.includes('makeup') || context.includes('cream') || context.includes('perfume')

  const isFootwear = context.includes('shoe') || context.includes('footwear') || context.includes('sneaker') || context.includes('sandal') || context.includes('slipper') || context.includes('loafer') || context.includes('boot') || context.includes('flip flop') || context.includes('chappal')
  const isJeans = context.includes('jean') || context.includes('denim')
  const isKurtiSaree = context.includes('kurti') || context.includes('saree') || context.includes('lehenga') || context.includes('ethnic')
  const isWomenWestern = context.includes('western') || (context.includes('women') && !context.includes('kurti') && !context.includes('saree'))
  const isApparel = isJeans || isKurtiSaree || isWomenWestern || context.includes('shirt') || context.includes('t-shirt') || context.includes('tshirt') || context.includes('top') || context.includes('dress') || context.includes('pant') || context.includes('jacket') || context.includes('western') || context.includes('lingerie') || context.includes('men')

  // Rule: Watches, electronics, jewellery, kitchen, beauty, toys DO NOT HAVE APPAREL SIZES!
  const hasNoSize = isWatch || isElectronics || isAccessories || isHomeKitchen || isBeauty || isKids
  const showSizeFilter = !hasNoSize

  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''
  const currentGender = searchParams.get('gender') || ''
  const currentSize = searchParams.get('size') || ''
  const currentColor = searchParams.get('color') || ''
  const currentRating = searchParams.get('min_rating') || ''
  const currentDiscount = searchParams.get('min_discount') || ''
  const currentSubcategory = searchParams.get('subcategory') || ''

  const [customMin, setCustomMin] = useState(currentMinPrice)
  const [customMax, setCustomMax] = useState(currentMaxPrice)

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }))
  }

  const handlePricePreset = (min, max) => {
    if (min === null && max === null) {
      updateParam('min_price', '')
      updateParam('max_price', '')
      setCustomMin('')
      setCustomMax('')
      return
    }
    if (String(currentMinPrice) === String(min || '') && String(currentMaxPrice) === String(max || '')) {
      updateParam('min_price', '')
      updateParam('max_price', '')
      setCustomMin('')
      setCustomMax('')
    } else {
      updateParam('min_price', min !== null ? String(min) : '')
      updateParam('max_price', max !== null ? String(max) : '')
      setCustomMin(min !== null ? String(min) : '')
      setCustomMax(max !== null ? String(max) : '')
    }
  }

  const handleCustomPriceSubmit = (e) => {
    e.preventDefault()
    updateParam('min_price', customMin.trim())
    updateParam('max_price', customMax.trim())
  }

  const hasActiveFilters = Boolean(
    activeCategorySlug ||
    currentMinPrice ||
    currentMaxPrice ||
    currentGender ||
    currentSize ||
    currentColor ||
    currentRating ||
    currentDiscount ||
    currentSubcategory
  )

  // Determine which subcategories to show under Category
  let categoryListToRender = null
  if (isKids) {
    categoryListToRender = KIDS_TOYS_SUBCATEGORIES
  } else if (isWatch) {
    categoryListToRender = WATCH_SUBCATEGORIES
  } else if (isFootwear) {
    categoryListToRender = FOOTWEAR_SUBCATEGORIES
  } else if (isAccessories) {
    categoryListToRender = ACCESSORIES_BELTS_SUBCATEGORIES
  } else if (isHomeKitchen) {
    categoryListToRender = HOME_KITCHEN_SUBCATEGORIES
  } else if (isKurtiSaree) {
    categoryListToRender = KURTI_SAREE_SUBCATEGORIES
  } else if (isWomenWestern) {
    categoryListToRender = WOMEN_WESTERN_SUBCATEGORIES
  } else if (isJeans) {
    categoryListToRender = JEANS_SUBCATEGORIES
  }

  return (
    <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
      {/* Top Header - Exact Meesho Style */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-sm text-gray-900 tracking-wide">FILTERS</h2>
          <p className="text-[11px] text-gray-500 font-medium">
            {totalProducts > 0 ? `${totalProducts}+ Products` : 'All Products'}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] font-black text-purple-700 hover:text-purple-900 hover:underline cursor-pointer uppercase tracking-wider"
          >
            CLEAR ALL
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin">
        {/* 1. Category / Subcategory Filter (Meesho Style with Search) */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
          >
            <span>Category</span>
            {openSections.category ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {openSections.category && (
            <div className="mt-2.5 space-y-2">
              {/* Meesho in-filter search input */}
              <div className="relative">
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full text-[11px] px-2.5 py-1.5 pl-7 rounded-lg border border-gray-200 bg-gray-50/70 focus:bg-white focus:border-purple-500 outline-none transition-all"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                {catSearch && (
                  <button
                    type="button"
                    onClick={() => setCatSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px]"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {categoryListToRender ? (
                  // Contextual subcategories (e.g. for Toys, Watches, Shoes, Belts, Kitchen)
                  categoryListToRender
                    .filter(subcat => subcat.toLowerCase().includes(catSearch.toLowerCase()))
                    .map((subcat) => {
                      const isChecked = currentSubcategory.toLowerCase() === subcat.toLowerCase() ||
                        searchQuery.toLowerCase().includes(subcat.toLowerCase().replace('watches', 'watch'))
                      return (
                        <label
                          key={subcat}
                          onClick={() => {
                            if (isChecked) {
                              updateParam('subcategory', '')
                            } else {
                              updateParam('subcategory', subcat)
                            }
                          }}
                          className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-gray-300"
                          />
                          <span className="truncate">{subcat}</span>
                        </label>
                      )
                    })
                ) : (
                  // General store categories
                  <>
                    <label
                      onClick={() => updateParam('category', '')}
                      className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-colors ${
                        !activeCategorySlug ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!activeCategorySlug}
                        onChange={() => {}}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-gray-300"
                      />
                      <span className="truncate font-semibold">All Categories</span>
                    </label>

                    {categories
                      .filter(cat => cat.name.toLowerCase().includes(catSearch.toLowerCase()))
                      .map((cat) => {
                        const isSelected = activeCategorySlug === cat.slug
                        return (
                          <label
                            key={cat.id}
                            onClick={() => updateParam('category', isSelected ? '' : cat.slug)}
                            className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-gray-300"
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        )
                      })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Gender Filter */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('gender')}
            className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
          >
            <span>Gender</span>
            {openSections.gender ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {openSections.gender && (
            <div className="mt-3 flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => {
                const isSelected = currentGender.toLowerCase() === g.toLowerCase()
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateParam('gender', isSelected ? '' : g.toLowerCase())}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 3. Watch Specific: Dial Shape */}
        {isWatch && (
          <div className="p-4">
            <button
              type="button"
              onClick={() => toggleSection('dialShape')}
              className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
            >
              <span>Dial Shape</span>
              {openSections.dialShape ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.dialShape && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {WATCH_DIAL_SHAPES.map((shape) => {
                  const isSelected = searchParams.get('shape')?.toLowerCase() === shape.toLowerCase()
                  return (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => updateParam('shape', isSelected ? '' : shape.toLowerCase())}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      {shape}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Watch Specific: Strap Material */}
        {isWatch && (
          <div className="p-4">
            <button
              type="button"
              onClick={() => toggleSection('strap')}
              className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
            >
              <span>Strap Material</span>
              {openSections.strap ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.strap && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {WATCH_STRAP_MATERIALS.map((mat) => {
                  const isSelected = searchParams.get('strap')?.toLowerCase() === mat.toLowerCase()
                  return (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => updateParam('strap', isSelected ? '' : mat.toLowerCase())}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold ring-1 ring-purple-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      {mat}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Apparel Specific: Fabric */}
        {isApparel && !hasNoSize && (
          <div className="p-4">
            <button
              type="button"
              onClick={() => toggleSection('fabric')}
              className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
            >
              <span>Fabric</span>
              {openSections.fabric ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.fabric && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {APPAREL_FABRICS.map((fab) => {
                  const isSelected = searchParams.get('fabric')?.toLowerCase() === fab.toLowerCase()
                  return (
                    <button
                      key={fab}
                      type="button"
                      onClick={() => updateParam('fabric', isSelected ? '' : fab.toLowerCase())}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold ring-1 ring-purple-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      {fab}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. Size Filter (ONLY SHOWN WHEN RELEVANT - HIDDEN FOR WATCHES, ELECTRONICS, JEWELLERY, ETC.) */}
        {showSizeFilter && (
          <div className="p-4">
            <button
              type="button"
              onClick={() => toggleSection('size')}
              className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
            >
              <span>Size</span>
              {openSections.size ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.size && (
              <div className="mt-3 space-y-2.5">
                {/* If footwear category or search, only show footwear sizes */}
                {isFootwear ? (
                  <>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Footwear Sizes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {FOOTWEAR_SIZES.map((s) => {
                        const isSelected = currentSize.toLowerCase() === s.toLowerCase()
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateParam('size', isSelected ? '' : s)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700 bg-white'
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : isApparel ? (
                  <>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Apparel Sizes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {APPAREL_SIZES.map((s) => {
                        const isSelected = currentSize.toLowerCase() === s.toLowerCase()
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateParam('size', isSelected ? '' : s)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700 bg-white'
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Apparel Sizes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {APPAREL_SIZES.map((s) => {
                        const isSelected = currentSize.toLowerCase() === s.toLowerCase()
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateParam('size', isSelected ? '' : s)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700 bg-white'
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>

                    <div className="text-[10px] font-bold text-gray-400 uppercase pt-2">Footwear Sizes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {FOOTWEAR_SIZES.map((s) => {
                        const isSelected = currentSize.toLowerCase() === s.toLowerCase()
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateParam('size', isSelected ? '' : s)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700 bg-white'
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 7. Color Filter */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
          >
            <span>Color</span>
            {openSections.color ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {openSections.color && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {POPULAR_COLORS.map((c) => {
                const isSelected = currentColor.toLowerCase() === c.name.toLowerCase()
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => updateParam('color', isSelected ? '' : c.name.toLowerCase())}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 font-bold text-purple-900 ring-1 ring-purple-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex-shrink-0 ${c.border ? 'border border-gray-300' : ''}`}
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate text-xs">{c.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 8. Price Filter */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
          >
            <span>Price</span>
            {openSections.price ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {openSections.price && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map((p, idx) => {
                  const isSelected =
                    String(currentMinPrice) === String(p.min !== null ? p.min : '') &&
                    String(currentMaxPrice) === String(p.max !== null ? p.max : '')
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePricePreset(p.min, p.max)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>

              {/* Custom Min/Max */}
              <form onSubmit={handleCustomPriceSubmit} className="pt-2 border-t border-gray-100 flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="₹ Min"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-purple-600"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="₹ Max"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-purple-600"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors text-xs"
                >
                  Go
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 9. Rating Filter */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
          >
            <span>Rating</span>
            {openSections.rating ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {openSections.rating && (
            <div className="mt-3 space-y-1.5">
              {RATING_OPTIONS.map((r) => {
                const isSelected = currentRating === r.value
                return (
                  <label
                    key={r.value}
                    onClick={() => updateParam('min_rating', isSelected ? '' : r.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-gray-300"
                    />
                    <div className="flex items-center gap-1 font-bold">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                      <span>{r.label}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* 10. Discount Filter */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('discount')}
            className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
          >
            <span>Discount</span>
            {openSections.discount ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {openSections.discount && (
            <div className="mt-3 space-y-1.5">
              {DISCOUNT_OPTIONS.map((d) => {
                const isSelected = currentDiscount === d.value
                return (
                  <label
                    key={d.value}
                    onClick={() => updateParam('min_discount', isSelected ? '' : d.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-gray-300"
                    />
                    <span>{d.label}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* 11. Assurance & Highlights (Meesho Mall / Gold Style) */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('assurance')}
            className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-xs"
          >
            <span>ShopEzy Assured</span>
            {openSections.assurance ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {openSections.assurance && (
            <div className="mt-3 space-y-2 text-gray-600">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-900 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span>100% Cash on Delivery</span>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-green-900 font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>Free Doorstep Delivery</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-gray-800 font-bold flex items-center gap-1.5">
                <span>🇮🇳 Country of Origin: India</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Close Button */}
      {onCloseMobile && (
        <div className="p-3 border-t border-gray-100 lg:hidden bg-gray-50">
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-center"
          >
            Apply & View Products ({totalProducts})
          </button>
        </div>
      )}
    </aside>
  )
}
