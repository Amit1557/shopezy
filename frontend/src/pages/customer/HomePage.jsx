import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Truck, Shield, RefreshCw, CreditCard, ArrowRight, Flame, Star, Zap, Check } from 'lucide-react'
import { categoriesAPI, productsPublicAPI } from '../../services/api'
import ProductCard from '../../components/customer/ProductCard'
import CategoryCard from '../../components/customer/CategoryCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const BANNERS = [
  {
    title: "Lowest Prices, Best Quality",
    subtitle: "Direct from verified Indian wholesale suppliers with 100% Free Cash on Delivery",
    cta: "Shop Now",
    link: "/products",
    badge: "⚡ Meesho Reseller Deals",
    discount: "UP TO 70% OFF",
    bg: "from-purple-900 via-purple-700 to-pink-600",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=80",
    highlights: ["Free Doorstep Delivery", "7-Day Easy Exchange", "Cash on Delivery"]
  },
  {
    title: "Trending Indian Reseller Deals",
    subtitle: "Affordable sarees, kurtis, jeans & home essentials at true factory prices",
    cta: "Explore Trending",
    link: "/products?sort=popular",
    badge: "🔥 Trending Collection",
    discount: "STARTING @ ₹149",
    bg: "from-pink-900 via-rose-700 to-purple-800",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80",
    highlights: ["Handpicked Quality", "Safe & Secure COD", "Pan-India Delivery"]
  },
  {
    title: "Fresh New Arrivals This Week",
    subtitle: "New stylish apparel, footwear, and smart accessories added daily",
    cta: "View New Styles",
    link: "/products?sort=newest",
    badge: "✨ Just Arrived",
    discount: "SPECIAL LAUNCH PRICES",
    bg: "from-indigo-950 via-purple-800 to-pink-700",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
    highlights: ["Trending Styles", "Zero Hidden Charges", "Pay on Delivery"]
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
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-14 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase border border-white/20">
                <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
                {BANNERS[activeBanner].badge}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-sm">
                {BANNERS[activeBanner].title}
              </h1>

              <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-xl">
                {BANNERS[activeBanner].subtitle}
              </p>

              {/* Quick Perks */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-white/90">
                {BANNERS[activeBanner].highlights.map((h, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/20 backdrop-blur-xs border border-white/10">
                    <Check className="w-3.5 h-3.5 text-yellow-300" /> {h}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Link
                  to={BANNERS[activeBanner].link}
                  className="inline-flex items-center gap-2 bg-white text-gray-950 font-black px-6 py-3.5 rounded-xl hover:bg-yellow-300 transition-all shadow-xl active:scale-95 text-sm"
                >
                  {BANNERS[activeBanner].cta} <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="bg-white/10 border border-white/20 px-3.5 py-2.5 rounded-xl text-xs font-black tracking-wider text-yellow-300 uppercase">
                  {BANNERS[activeBanner].discount}
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="hidden md:flex md:col-span-5 justify-center relative">
              <div className="relative w-72 h-80 lg:w-80 lg:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 group">
                <img
                  src={BANNERS[activeBanner].image}
                  alt={BANNERS[activeBanner].title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl text-gray-900 shadow-lg flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">Top Rated Seller</div>
                    <div className="text-xs font-extrabold line-clamp-1">100% Cash on Delivery</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black">
                    FREE COD
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Banner dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveBanner(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === activeBanner ? 'bg-white w-7' : 'bg-white/40 w-2'}`}
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
          <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                  <span>🛍️ Explore Top Categories</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Find whatever you love with 100% Free Cash on Delivery</p>
              </div>
              <Link to="/products" className="text-xs sm:text-sm text-purple-700 hover:text-purple-800 flex items-center gap-1 font-bold">
                View All Categories <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-6 md:grid-cols-9 gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
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

