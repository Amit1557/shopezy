import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Truck, Shield, RefreshCw, CreditCard, ArrowRight, Flame, Star, Zap } from 'lucide-react'
import { categoriesAPI, productsPublicAPI } from '../../services/api'
import ProductCard from '../../components/customer/ProductCard'
import CategoryCard from '../../components/customer/CategoryCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const BANNERS = [
  {
    title: "Fashion That Fits Your Style",
    subtitle: "Discover thousands of curated products with Free Cash on Delivery",
    cta: "Shop Now",
    link: "/products",
    bg: "from-brand-600 via-brand-500 to-pink-500",
    emoji: "👗"
  },
  {
    title: "Trending Indian Reseller Deals",
    subtitle: "Affordable fashion, accessories & home essentials at wholesale prices",
    cta: "Explore Trending",
    link: "/products?sort=popular",
    bg: "from-pink-600 via-pink-500 to-brand-500",
    emoji: "🔥"
  },
  {
    title: "New Arrivals Every Week",
    subtitle: "Fresh styles directly sourced and delivered right to your doorstep",
    cta: "View New",
    link: "/products?sort=newest",
    bg: "from-indigo-600 via-brand-600 to-pink-500",
    emoji: "✨"
  }
]

const FEATURES = [
  { icon: Truck, title: 'Free Delivery', desc: 'On all orders across India' },
  { icon: CreditCard, title: 'Cash on Delivery', desc: 'Pay when your parcel arrives' },
  { icon: Shield, title: 'Verified Quality', desc: 'Handpicked products guaranteed' },
  { icon: RefreshCw, title: 'Easy Returns', desc: 'Hassle-free replacement support' },
]

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [trending, setTrending] = useState([])
  const [featured, setFeatured] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeBanner, setActiveBanner] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, trendRes, featRes, newRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsPublicAPI.getAll({ sort: 'popular', limit: 8 }),
          productsPublicAPI.getAll({ featured: true, limit: 8 }),
          productsPublicAPI.getAll({ sort: 'newest', limit: 8 }),
        ])
        setCategories(catRes.data || [])
        setTrending(trendRes.data.products || [])
        setFeatured(featRes.data.products || [])
        setNewArrivals(newRes.data.products || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(() => setActiveBanner(b => (b + 1) % BANNERS.length), 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <div>
      {/* Hero Carousel Banner */}
      <section className="relative overflow-hidden">
        <div className={`bg-gradient-to-r ${BANNERS[activeBanner].bg} text-white transition-all duration-700 ease-in-out`}>
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 flex items-center justify-between">
            <div className="max-w-lg">
              <div className="text-5xl mb-4">{BANNERS[activeBanner].emoji}</div>
              <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                {BANNERS[activeBanner].title}
              </h1>
              <p className="text-white/90 mb-6 text-sm md:text-base leading-relaxed">
                {BANNERS[activeBanner].subtitle}
              </p>
              <Link
                to={BANNERS[activeBanner].link}
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-lg active:scale-95"
              >
                {BANNERS[activeBanner].cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden md:block text-9xl opacity-25 select-none animate-pulse">
              {BANNERS[activeBanner].emoji}
            </div>
          </div>
        </div>

        {/* Banner dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveBanner(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${i === activeBanner ? 'bg-white w-8' : 'bg-white/50 w-2.5'}`}
            />
          ))}
        </div>
      </section>

      {/* Trust Badges Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{title}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Categories Section */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Explore Top Categories</h2>
                <p className="text-xs text-gray-500 mt-0.5">Find whatever you love with cash on delivery</p>
              </div>
              <Link to="/products" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                <h2 className="text-xl font-bold text-gray-900">Featured Collection</h2>
              </div>
              <Link to="/products?featured=true" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5">
              {featured.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Trending Deals */}
        {trending.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-400" />
                <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
              </div>
              <Link to="/products?sort=popular" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5">
              {trending.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-600 fill-brand-500" />
                <h2 className="text-xl font-bold text-gray-900">New Arrivals</h2>
              </div>
              <Link to="/products?sort=newest" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5">
              {newArrivals.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

