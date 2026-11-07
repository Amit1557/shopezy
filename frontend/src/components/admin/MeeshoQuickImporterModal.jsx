import { useState, useEffect } from 'react'
import {
  Sparkles, Link as LinkIcon, DollarSign, Image as ImageIcon,
  CheckCircle, ArrowRight, ExternalLink, X, Plus, Trash2,
  TrendingUp, ShieldCheck, RefreshCw, Upload, AlertCircle,
  Clipboard, HelpCircle, Check, Bookmark, MousePointer
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

// Curated showcase photos by Meesho Category
const CATEGORY_SHOWCASE_PHOTOS = {
  'bags-footwear': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
  ],
  'kurti-saree-lehenga': [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
  ],
  'women-western': [
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
  ],
  'men': [
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  ],
  'kids-toys': [
    'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80',
  ],
  'home-kitchen': [
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
  ],
  'beauty-health': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  ],
  'jewellery-accessories': [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  ],
  'electronics': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
  ],
  'watches': [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
  ],
  'sports-fitness': [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
  ]
}

export const isCleanProductImage = (url) => {
  if (!url || typeof url !== 'string') return false
  const u = url.trim()
  if (!u.startsWith('http')) return false
  if (u.includes('meesho.com/p/')) return false
  // If the image is on Meesho CDN, it MUST be an authentic product photo inside /products/
  if (u.includes('images.meesho.com') && !u.includes('/products/')) return false
  // Strict regex to reject marketing ribbons, 35% off app ads, coupons, banners, etc.
  if (/banner|offer|promo|download|app_download|app_install|campaign|strip|badge|coupon|supplier|header|footer|35%|35_off|icon|logo|avatar|rating|star|google_play|app_store|marketing|growth|pow|widgets|ribbon|first_order/i.test(u)) {
    return false
  }
  return true
}

import { BEAUTY_HEALTH_REGEX } from './BulkProductImporterModal'

export function mapCategoryToSlug(text) {
  if (!text) return 'beauty-health'
  const t = text.toLowerCase()

  // 1. Beauty, Fragrances & Cosmetics (High Priority)
  if (BEAUTY_HEALTH_REGEX.test(t) || /beauty|makeup|cream|perfume|parfum|edp|edt|cologne|attar|deo|spray|mist|skincare|serum|lipstick|hair oil|eyeliner|kajal|facewash/i.test(t)) {
    return 'beauty-health'
  }

  // 2. Ethnic Wear (Kurti, Saree, Lehenga)
  if (/saree|sari|kurti|kurta set|anarkali|lehenga|ethnic|dupatta|salwar|suit material|sharara|gharara/i.test(t)) {
    if (/\b(men|boys?|gents)\b/i.test(t) && /kurta|sherwani|dhoti/i.test(t)) return 'men'
    return 'kurti-saree-lehenga'
  }

  // 3. Footwear & Bags
  if (/shoe|sneaker|sandal|slipper|footwear|boot|loafer|crocs|heel|flat|bag|backpack|handbag|tote|purse|wallet|chappal|flip flop/i.test(t)) return 'bags-footwear'

  // 4. Belts & Fashion Accessories (High Priority for Belts)
  if (/belt|belts|waist belt|leather belt|buckle|jewel|necklace|earring|bangle|ring|bracelet|chain|sunglass|jhumka/i.test(t)) return 'jewellery-accessories'

  // 5. Lingerie & Sleepwear
  if (/bra|panty|panties|lingerie|nighty|sleepwear|babydoll|boxer|brief/i.test(t)) return 'lingerie'

  // 6. Watches
  if (/watch|smartwatch/i.test(t)) return 'watches'

  // 7. Electronics & Audio
  if (/earphone|headphone|earbud|airpod|speaker|electronic|charger|bluetooth|tws|neckband/i.test(t)) return 'electronics'

  // 8. Kids & Toys (including baby mattress)
  if (/kid|baby|toy|infant|toddler|romper|frock|children|child/i.test(t) || (/\b(boys?|girls?)\b/i.test(t) && /wear|cloth|frock|dress|set|suit|tshirt|shirt|shorts/i.test(t))) return 'kids-toys'

  // 9. Home & Kitchen (bedsheet, mattress, cookware)
  if (/kitchen|home|cookware|bottle|bedsheet|mattress|curtain|storage|lunch box|kadhai|pan/i.test(t)) return 'home-kitchen'

  // 10. Sports & Fitness
  if (/gym|dumbbell|fitness|yoga|exercise/i.test(t)) return 'sports-fitness'

  // 11. Women Western Wear
  const isFemale = /\b(women|woman|ladies|girls?|female)\b/i.test(t)
  if (isFemale && /dress|western|top|tunic|jumpsuit|gown|skirt|crop top|shirt|tshirt|t-shirt|jean|jeans|trouser|cargo|jogger|palazzo|plazo|shorts|hoodie|jacket/i.test(t)) return 'women-western'
  if (/dress|western|top|gown|skirt|crop top|palazzo|plazo/i.test(t)) return 'women-western'
  if (isFemale) return 'women-western'

  // 12. Men Apparel (must use \b word boundary so 'women' never matches 'men'!)
  if (/\b(men|man|gents|male)\b/i.test(t) || /shirt|tshirt|t-shirt|polo|jean|trouser|cargo|jogger|hoodie|jacket/i.test(t)) return 'men'

  return 'home-kitchen'
}

export default function MeeshoQuickImporterModal({ isOpen, onClose, onSuccess, initialData }) {
  const [categories, setCategories] = useState([])
  
  // Step / Mode
  const [parsing, setParsing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedProduct, setPublishedProduct] = useState(null)
  const [showBookmarkletHelp, setShowBookmarkletHelp] = useState(false)

  // Input fields
  const [rawText, setRawText] = useState('')
  const [quickCost, setQuickCost] = useState('')
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categorySlug, setCategorySlug] = useState('bags-footwear')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [meeshoLink, setMeeshoLink] = useState('')
  const [images, setImages] = useState([])
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [sizes, setSizes] = useState(['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'])
  const [newSize, setNewSize] = useState('')
  const [colors, setColors] = useState([])
  const [newColor, setNewColor] = useState('')
  const [description, setDescription] = useState('')
  const [specifications, setSpecifications] = useState({})
  const [uploading, setUploading] = useState(false)

  // Load categories
  useEffect(() => {
    if (isOpen) {
      categoriesAPI.getAll(false).then(res => {
        const catList = res.data || []
        setCategories(catList)
        if (catList.length > 0 && !categoryId) {
          setCategoryId(String(catList[0].id))
          setCategorySlug(catList[0].slug)
        }
      }).catch(() => {})
    }
  }, [isOpen])

  // Handle initial data from 1-Click Bookmarklet
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.name) setName(initialData.name)
      if (initialData.purchase_cost) {
        const costStr = String(initialData.purchase_cost)
        setPurchaseCost(costStr)
        setQuickCost(costStr)
        const cost = parseFloat(initialData.purchase_cost)
        const suggestedSell = cost <= 250 ? cost + 200 : (cost <= 500 ? cost + 250 : Math.round(cost * 1.55))
        const roundedSell = Math.max(cost + 150, Math.round(suggestedSell / 10) * 10 - 1)
        setSellingPrice(String(roundedSell))
        setOriginalPrice(String(roundedSell + 400))
      }
      if (initialData.meesho_link) setMeeshoLink(initialData.meesho_link)
      if (initialData.images && initialData.images.length > 0) {
        const cleanInitial = initialData.images.filter(isCleanProductImage)
        setImages(cleanInitial)
      }
      if (initialData.sizes && initialData.sizes.length > 0 && !(initialData.sizes.length === 1 && initialData.sizes[0] === 'Free Size')) {
        setSizes(initialData.sizes)
      } else {
        const lowerName = (initialData.name || '').toLowerCase()
        if (/jean|cargo|jogger|pant|trouser|bottom/i.test(lowerName)) {
          setSizes(['30', '32', '34', '36'])
        } else if (/shoe|sneaker|footwear|sandal/i.test(lowerName)) {
          setSizes(['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'])
        } else if (/shirt|kurti|dress|t-shirt|top/i.test(lowerName)) {
          setSizes(['S', 'M', 'L', 'XL', 'XXL'])
        } else if (initialData.sizes && initialData.sizes.length > 0) {
          setSizes(initialData.sizes)
        }
      }
      if (initialData.description) setDescription(initialData.description)
      if (initialData.specifications) setSpecifications(initialData.specifications)

      // Auto-detect colors from initial data
      if (initialData.colors && initialData.colors.length > 0) {
        setColors(initialData.colors)
      } else {
        const foundColors = []
        const titleMatch = (initialData.name || '').match(/\b(Black|Blue|Navy|White|Red|Green|Grey|Gray|Yellow|Pink|Maroon|Brown|Beige|Orange|Purple|Olive|Tan|Multicolor)\b/gi)
        if (titleMatch) {
          titleMatch.forEach(c => {
            const cap = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
            if (!foundColors.includes(cap)) foundColors.push(cap)
          })
        }
        if (foundColors.length > 0) setColors(foundColors)
      }

      // Auto-match category from Meesho
      const rawCatText = initialData.category || initialData.category_slug || initialData.name || ''
      const matchedSlug = mapCategoryToSlug(rawCatText)
      setCategorySlug(matchedSlug)
      if (categories && categories.length > 0) {
        const found = categories.find(c => c.slug === matchedSlug) || categories.find(c => c.slug.includes(matchedSlug))
        if (found) setCategoryId(String(found.id))
      }

      toast.success('⚡ Product loaded from Meesho via 1-Click Bookmarklet!')
    }
  }, [isOpen, initialData, categories])

  // Clipboard paste listener for images (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return

    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            e.preventDefault()
            setUploading(true)
            try {
              const formData = new FormData()
              formData.append('file', blob, `pasted-image-${Date.now()}.png`)
              const res = await productsAdminAPI.uploadImage(formData)
              setImages(prev => [res.data.image_url, ...prev])
              toast.success('Pasted Meesho image attached successfully!')
            } catch {
              toast.error('Failed to attach pasted image')
            } finally {
              setUploading(false)
            }
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen])

  if (!isOpen) return null

  // Reset all fields
  const resetForm = () => {
    setPublishedProduct(null)
    setRawText('')
    setQuickCost('')
    setName('')
    setPurchaseCost('')
    setSellingPrice('')
    setOriginalPrice('')
    setMeeshoLink('')
    setImages([])
    setImageUrlInput('')
    setSizes(['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'])
    setColors([])
    setDescription('')
  }

  // Handle parsing Meesho text or link
  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error('Please paste a Meesho link or product description first')
      return
    }

    setParsing(true)
    try {
      const costToSend = quickCost ? parseFloat(quickCost) : (purchaseCost ? parseFloat(purchaseCost) : undefined)
      const res = await productsAdminAPI.parseMeesho({
        raw_text: rawText.trim(),
        meesho_cost: costToSend
      })
      const data = res.data

      if (data.name) setName(data.name)
      if (data.purchase_cost) {
        setPurchaseCost(String(data.purchase_cost))
        setQuickCost(String(data.purchase_cost))
      }
      if (data.selling_price) setSellingPrice(String(data.selling_price))
      if (data.original_price) setOriginalPrice(String(data.original_price))
      if (data.meesho_link) setMeeshoLink(data.meesho_link)
      if (data.description) setDescription(data.description)
      if (data.specifications) setSpecifications(data.specifications)
      
      // Auto-set intelligent sizes (IND-6..10 for shoes, 30..36 for bottomwear, S..XXL for apparel)
      if (data.sizes && data.sizes.length > 0) {
        setSizes(data.sizes)
      } else {
        const lowerName = (data.name || rawText).toLowerCase()
        if (/jean|cargo|jogger|pant|trouser|bottom/i.test(lowerName)) {
          setSizes(['30', '32', '34', '36'])
        } else if (/shoe|sneaker|footwear/i.test(lowerName)) {
          setSizes(['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'])
        } else if (/shirt|kurti|dress|t-shirt|top/i.test(lowerName)) {
          setSizes(['S', 'M', 'L', 'XL', 'XXL'])
        }
      }

      // Auto-set intelligent colors
      if (data.colors && data.colors.length > 0) {
        setColors(data.colors)
      } else {
        const foundColors = []
        const titleMatch = (data.name || rawText).match(/\b(Black|Blue|Navy|White|Red|Green|Grey|Gray|Yellow|Pink|Maroon|Brown|Beige|Orange|Purple|Olive|Tan|Multicolor)\b/gi)
        if (titleMatch) {
          titleMatch.forEach(c => {
            const cap = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
            if (!foundColors.includes(cap)) foundColors.push(cap)
          })
        }
        if (foundColors.length > 0) setColors(foundColors)
      }

      // Auto-attach photos (Strict anti-banner filter - blocks promo ribbons & 35% off app ads)
      if (data.images && data.images.length > 0) {
        const cleanImgs = data.images.filter(isCleanProductImage)
        setImages(cleanImgs)
      }

      // Match category
      if (data.category_slug) {
        setCategorySlug(data.category_slug)
        const match = categories.find(c => c.slug === data.category_slug)
        if (match) setCategoryId(String(match.id))
      }

      toast.success('Meesho details extracted! Category, price, sizes & photos ready.')
    } catch {
      toast.error('Could not auto-parse Meesho text. You can fill details manually.')
    } finally {
      setParsing(false)
    }
  }

  // Handle Category Change & sync default sizes and photos
  const handleCategoryChange = (newCatId) => {
    setCategoryId(newCatId)
    const cat = categories.find(c => String(c.id) === String(newCatId))
    if (!cat) return
    const slug = cat.slug
    setCategorySlug(slug)

    // Auto-update sizes when category changes
    if (slug === 'bags-footwear' || slug === 'footwear') {
      setSizes(['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'])
    } else if (slug === 'men' || slug === 'mens-fashion' || slug === 'kurti-saree-lehenga' || slug === 'women-western') {
      setSizes(['S', 'M', 'L', 'XL', 'XXL'])
    } else if (slug === 'kids-toys' || slug === 'kids-fashion') {
      setSizes(['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs'])
    } else {
      setSizes(['Free Size'])
    }

    // Auto-suggest image if no custom image added yet
    if (images.length === 0 && CATEGORY_SHOWCASE_PHOTOS[slug]) {
      setImages([CATEGORY_SHOWCASE_PHOTOS[slug][0]])
    }
  }

  // Handle Cost Change -> auto calculate selling price & MRP
  const handleCostChange = (val) => {
    setPurchaseCost(val)
    const cost = parseFloat(val) || 0
    if (cost > 0) {
      const suggestedSell = cost <= 250 ? cost + 200 : (cost <= 500 ? cost + 250 : Math.round(cost * 1.55))
      const roundedSell = Math.max(cost + 150, Math.round(suggestedSell / 10) * 10 - 1)
      setSellingPrice(String(roundedSell))
      setOriginalPrice(String(roundedSell + 400))
    }
  }

  // Quick Preset Sizes
  const applySizePreset = (presetType) => {
    if (presetType === 'jeans') {
      setSizes(['28', '30', '32', '34', '36', '38'])
    } else if (presetType === 'shoes') {
      setSizes(['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'])
    } else if (presetType === 'clothing') {
      setSizes(['S', 'M', 'L', 'XL', 'XXL'])
    } else if (presetType === 'free') {
      setSizes(['Free Size'])
    } else if (presetType === 'kids') {
      setSizes(['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs'])
    }
  }

  // Image Upload via File
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await productsAdminAPI.uploadImage(formData)
      setImages(prev => [res.data.image_url, ...prev])
      toast.success('Image uploaded!')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Add image by URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return
    const url = imageUrlInput.trim()
    if (!isCleanProductImage(url)) {
      toast.error('This link looks like an advertisement, offer banner or webpage, not a valid product photo!')
      return
    }
    if (!images.includes(url)) {
      setImages(prev => [url, ...prev])
      setImageUrlInput('')
      toast.success('Image URL added')
    }
  }

  // Remove image
  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  // Select showcase photo
  const selectShowcasePhoto = (photoUrl) => {
    if (!images.includes(photoUrl)) {
      setImages(prev => [photoUrl, ...prev])
      toast.success('Photo added as main photo!')
    }
  }

  // Size toggle
  const toggleSize = (sz) => {
    if (sizes.includes(sz)) {
      setSizes(sizes.filter(s => s !== sz))
    } else {
      setSizes([...sizes, sz])
    }
  }

  const addCustomSize = (e) => {
    e.preventDefault()
    if (!newSize.trim()) return
    if (!sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()])
    }
    setNewSize('')
  }

  // Color toggle
  const toggleColor = (clr) => {
    if (colors.includes(clr)) {
      setColors(colors.filter(c => c !== clr))
    } else {
      setColors([...colors, clr])
    }
  }

  const addCustomColor = (e) => {
    e.preventDefault()
    if (!newColor.trim()) return
    const formatted = newColor.trim().charAt(0).toUpperCase() + newColor.trim().slice(1)
    if (!colors.includes(formatted)) {
      setColors([...colors, formatted])
    }
    setNewColor('')
  }

  // Calculate profit
  const costNum = parseFloat(purchaseCost) || 0
  const sellNum = parseFloat(sellingPrice) || 0
  const profitNum = sellNum - costNum
  const profitMarginPercent = sellNum > 0 ? Math.round((profitNum / sellNum) * 100) : 0

  // 1-Click Publish
  const handle1ClickPublish = async () => {
    if (!name.trim()) {
      toast.error('Product title is required')
      return
    }
    if (!sellNum || sellNum <= 0) {
      toast.error('Please enter a valid Selling Price')
      return
    }

    setPublishing(true)
    try {
      const payload = {
        name: name.trim(),
        selling_price: sellNum,
        purchase_cost: costNum,
        original_price: parseFloat(originalPrice) || (sellNum + 200),
        category_id: categoryId ? parseInt(categoryId) : undefined,
        category_slug: categorySlug,
        description: description || undefined,
        meesho_link: meeshoLink || undefined,
        images: images.filter(isCleanProductImage),
        sizes: sizes.length > 0 ? sizes : ['Free Size'],
        colors: colors,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
        is_active: true,
        is_featured: false,
        cod_available: true,
        stock_quantity: 100
      }

      const res = await productsAdminAPI.quickPublish(payload)
      setPublishedProduct(res.data)
      toast.success('🎉 Product published live to your website!')
      if (onSuccess) onSuccess(res.data)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to publish product')
    } finally {
      setPublishing(false)
    }
  }

  // Super-smart 1-Click Bookmarklet: extracts exact price, Meesho breadcrumb category, sizes & clean photos (No promo banners)
  const bookmarkletCode = `javascript:(function(){try{var t=document.querySelector('h1')?.innerText||document.title.replace(/\\s*\\|.*$/,'').trim();var p=0;var cat='';var jd=null;document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){try{var j=JSON.parse(s.innerText);if(j['@type']==='Product'||(Array.isArray(j)&&j[0]&&j[0]['@type']==='Product')){jd=Array.isArray(j)?j[0]:j;}}catch(e){}});if(jd){if(jd.name)t=jd.name.trim();if(jd.category)cat=jd.category;if(jd.offers){p=parseFloat(jd.offers.price||jd.offers.lowPrice||0);}}if(!p){var metaP=document.querySelector('meta[property="product:price:amount"]')?.content;if(metaP)p=parseFloat(metaP);}if(!p){var h1=document.querySelector('h1');var cont=h1?(h1.closest('div')||h1.parentElement):document.body;var pm=(cont?cont.innerText:'').match(/₹\\s*([0-9]+(?:\\.[0-9]+)?)/);if(pm)p=parseFloat(pm[1]);}if(!p){var allPm=document.body.innerText.match(/₹\\s*([0-9]{2,5})/g);if(allPm&&allPm.length>0){var cleanNums=allPm.map(function(s){return parseFloat(s.replace(/[^0-9]/g,''));}).filter(function(n){return n>=49&&n<=25000;});if(cleanNums.length>0)p=Math.min.apply(null,cleanNums);}}if(!cat){var bcEls=Array.from(document.querySelectorAll('div[class*="Breadcrumb"] a,nav a,ol li,span[class*="Breadcrumb"]'));var bcTexts=bcEls.map(function(e){return e.innerText.trim();}).filter(function(x){return x&&!/home/i.test(x)&&x.length<30;});if(bcTexts.length>0)cat=bcTexts.join(' > ');}var isProductImg=function(src){if(!src||typeof src!=='string'||!src.startsWith('http'))return false;if(src.indexOf('meesho.com/p/')!==-1)return false;if(src.indexOf('images.meesho.com')!==-1&&src.indexOf('/products/')===-1)return false;if(/(banner|offer|promo|download|app_download|campaign|strip|badge|coupon|supplier|header|footer|35%|35_off|icon|logo|avatar|rating|star|google_play|app_store|marketing|growth|pow|widgets|ribbon)/i.test(src))return false;return true;};var imgs=[];if(jd&&jd.image){var jImgs=Array.isArray(jd.image)?jd.image:[jd.image];jImgs.forEach(function(u){if(isProductImg(u)&&imgs.indexOf(u)===-1)imgs.push(u);});}var galEls=document.querySelectorAll('div[class*="ProductDesktopImage"] img,div[class*="ProductGallery"] img,div[class*="ProductImageSlider"] img,[data-testid="product-image"] img');if(galEls.length>0){galEls.forEach(function(el){var s=el.src;if(isProductImg(s)){var c=s.replace(/_[0-9]+\\.(jpg|webp|jpeg)/,'.jpg');if(imgs.indexOf(c)===-1)imgs.push(c);}});}if(imgs.length===0){document.querySelectorAll('img[src*="images.meesho.com/images/products/"]').forEach(function(el){var s=el.src;if(isProductImg(s)){var c=s.replace(/_[0-9]+\\.(jpg|webp|jpeg)/,'.jpg');if(imgs.indexOf(c)===-1)imgs.push(c);}});}var isNonClothing=/speaker|earphone|headphone|earbud|airpod|tws|bluetooth|charger|usb|cable|adapter|neckband|power bank|mic|stand|holder|tripod|aux|soundbar|mouse|keyboard|gadget|watch|smartwatch|perfume|parfum|fragrance|cologne|eau de|edp|edt|attar|deo|spray|mist|cream|lotion|serum|lipstick|makeup|shampoo|facewash|skincare|kajal|eyeliner|bottle|clock|curtain|bedsheet|cushion|pillow|blanket|cookware|bag|handbag|wallet|jewel|necklace|earring|ring|bangle|toy/i.test(t+' '+(cat||''));var sizes=[];if(isNonClothing){sizes=['Free Size'];}else{var sm=document.body.innerText.match(/\\b(IND-\\d+|UK-\\d+|XS|S|M|L|XL|XXL|3XL|Free Size)\\b/gi);if(sm){sm.forEach(function(s){var u=s.toUpperCase();if(sizes.indexOf(u)===-1&&sizes.length<8)sizes.push(u);});}}var d={name:t,purchase_cost:p,category:cat,meesho_link:window.location.href,images:imgs.slice(0,6),sizes:sizes.length?sizes:['Free Size']};window.open('${window.location.origin}/admin/products?importData='+encodeURIComponent(JSON.stringify(d)),'_blank');}catch(e){alert('Error: '+e.message);}})();`

  const showcaseOptions = CATEGORY_SHOWCASE_PHOTOS[categorySlug] || CATEGORY_SHOWCASE_PHOTOS['bags-footwear'] || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100 my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-800 to-pink-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-black text-base flex items-center gap-2">
                1-Click Fast Meesho Importer
              </h2>
              <p className="text-[11px] text-purple-100">
                Auto-detects Meesho category, sizes (IND-6..10, S..XXL), photos & prices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">

          {/* 1-Click Bookmarklet Super Tool Box */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  ⚡ 1-Click Meesho Chrome Bookmarklet
                  <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.2 rounded font-bold">Recommended</span>
                </span>
                <p className="text-[11px] text-gray-600">
                  Drag this button to your Bookmarks Bar. When browsing Meesho, 1 click imports photo, price & sizes!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  if (e.button === 0) {
                    toast('📌 Is button ko apne Chrome Bookmarks bar (Ctrl+Shift+B) me drag & drop karein!', { icon: '💡' })
                  }
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition-transform hover:scale-105"
                title="Drag this button to your Chrome/Edge bookmarks bar"
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>⚡ Add to ShopEzy</span>
              </a>
            </div>
          </div>

          {publishedProduct ? (
            /* SUCCESS VIEW */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Successfully Published
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-2">
                  {publishedProduct.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Live on your store with Free Cash on Delivery!
                </p>
              </div>

              {/* Profit Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200 max-w-md mx-auto text-left">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-100">
                  <span className="text-gray-600">Meesho Cost:</span>
                  <span className="font-bold text-gray-800">
                    {formatPrice(publishedProduct.purchase_cost || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-2 border-b border-emerald-100">
                  <span className="text-gray-600">Customer Selling Price:</span>
                  <span className="font-black text-brand-600 text-sm">
                    {formatPrice(publishedProduct.selling_price)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="font-bold text-emerald-800">Your Expected Profit:</span>
                  <span className="font-black text-emerald-600 text-base">
                    +{formatPrice(publishedProduct.selling_price - (publishedProduct.purchase_cost || 0))}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Import Another Product
                </button>
                <a
                  href={`/product/${publishedProduct.slug || publishedProduct.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
                >
                  <span>View on Live Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: PASTE MEESHO CONTENT */}
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Paste Meesho Link, Copied Text, or use "COPY" on Meesho
                  </label>
                  <span className="text-[11px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                    Auto-Extract Details
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste Meesho product URL or click Meesho's purple 'COPY' button under product highlights and paste here..."
                    className="input-field text-xs resize-none bg-white font-mono leading-relaxed"
                  />

                  {/* Optional Quick Cost Input */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                      <span className="text-[11px] font-bold text-gray-700">Meesho Cost (₹):</span>
                      <input
                        type="number"
                        value={quickCost}
                        onChange={(e) => {
                          setQuickCost(e.target.value)
                          handleCostChange(e.target.value)
                        }}
                        placeholder="e.g. 274"
                        className="w-20 text-xs font-bold text-purple-700 border-none p-0 focus:ring-0 outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">
                      (Enter cost if link only — selling price & profit auto-calculates!)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2 pt-1">
                  <p className="text-[11px] text-gray-500">
                    Extracts title, sizes (IND-6..10 or S..XXL), category & photos automatically.
                  </p>
                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={parsing || !rawText.trim()}
                    className="btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {parsing ? <LoadingSpinner size="sm" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Extract Details
                  </button>
                </div>
              </div>

              {/* PRODUCT TITLE & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700">Product Title *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sports Shoe"
                    className="input-field text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="input-field text-xs font-bold text-purple-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 2: PHOTO / IMAGES */}
              <div className="space-y-2.5 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    Product Photo(s)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    💡 Tip: Meesho photo par Right-Click ➔ "Copy image" karein, yahan Ctrl+V dabayein!
                  </span>
                </div>

                {/* Attached Images */}
                <div className="flex flex-wrap gap-2 items-center">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border-2 border-purple-300 bg-gray-50 shrink-0 shadow-sm">
                      <img
                        src={img}
                        alt="Product"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (showcaseOptions[0]) e.target.src = showcaseOptions[0]
                        }}
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-purple-600 text-white text-[8px] font-black text-center py-0.5">
                          MAIN
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Controls */}
                  <div className="flex flex-wrap gap-2 items-center flex-1">
                    <label className="cursor-pointer border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 text-purple-700 rounded-lg w-16 h-16 flex flex-col items-center justify-center gap-1 text-[9px] font-bold transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <span>{uploading ? '...' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {/* Image URL input */}
                    <div className="flex-1 flex gap-1 min-w-[200px]">
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl() } }}
                        placeholder="Paste image link or right-click Meesho photo..."
                        className="input-field text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="btn-secondary text-xs px-3 py-1 font-bold shrink-0"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1-Click Pick from Category Showcase Photos */}
                {showcaseOptions.length > 0 && (
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Or pick from high-converting category photos in 1 click:
                      </span>
                      <span className="text-[10px] text-gray-400">Click to set as photo</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {showcaseOptions.map((photo, i) => {
                        const isSelected = images.includes(photo)
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectShowcasePhoto(photo)}
                            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-transform hover:scale-105 ${
                              isSelected ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img src={photo} alt="Showcase" className="w-full h-full object-cover" />
                            {isSelected && (
                              <span className="absolute inset-0 bg-purple-600/30 flex items-center justify-center text-white">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: PRICING & MARGIN CONTROL */}
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/40 p-4 rounded-xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    Pricing & Profit Margin Control (You Decide)
                  </label>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Live Margin Calculator
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Meesho Purchase Cost */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Meesho Cost (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={purchaseCost}
                        onChange={(e) => handleCostChange(e.target.value)}
                        placeholder="e.g. 274"
                        className="input-field pl-7 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>

                  {/* Customer Selling Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-brand-700 flex items-center gap-1">
                      Selling Price (₹) *
                      <span className="text-[10px] font-normal text-brand-500">(Customer Pays)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600 font-black text-sm">₹</span>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="e.g. 519"
                        className="input-field pl-7 text-sm font-black text-brand-700 border-brand-400 ring-2 ring-brand-100 bg-white"
                      />
                    </div>
                  </div>

                  {/* MRP / Original Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">MRP Reference (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="e.g. 879"
                        className="input-field pl-7 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Profit Summary Bar */}
                <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center justify-between text-xs shadow-sm">
                  <div>
                    <span className="text-gray-500 text-[11px]">Your Expected Profit per Order:</span>
                    <div className="text-base font-black text-emerald-600">
                      {profitNum > 0 ? `+${formatPrice(profitNum)}` : '₹0'}
                      {sellNum > 0 && profitNum > 0 && (
                        <span className="text-xs font-bold text-emerald-500 ml-1.5">
                          ({profitMarginPercent}% margin)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-400">
                    COD Delivery: <strong className="text-gray-700">Enabled</strong><br />
                    Customer View: <strong className="text-brand-600">{formatPrice(sellNum)}</strong>
                  </div>
                </div>
              </div>

              {/* AVAILABLE SIZES (Jeans 28..38, Shoes IND-6..10, Clothes S..XXL) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-xs font-bold text-gray-700">Available Sizes</label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => applySizePreset('jeans')}
                      className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded font-bold transition-colors"
                    >
                      👖 Jeans (28-36)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySizePreset('shoes')}
                      className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded font-bold transition-colors"
                    >
                      👟 Shoes (IND 6-10)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySizePreset('clothing')}
                      className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded font-bold transition-colors"
                    >
                      👕 Clothes (S-XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySizePreset('free')}
                      className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded font-bold transition-colors"
                    >
                      Free Size
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  {['28', '30', '32', '34', '36', '38', 'IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map((s) => {
                    const active = sizes.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors ${
                          active
                            ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                  <form onSubmit={addCustomSize} className="inline-flex gap-1 items-center">
                    <input
                      type="text"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="+ Custom Size"
                      className="text-xs py-1 px-2 border rounded-md w-24"
                    />
                  </form>
                </div>
              </div>

              {/* AVAILABLE COLORS (Meesho Multiple Color Variants) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span>🎨 Available Colors / Variants</span>
                    <span className="text-[10px] text-gray-400 font-normal">(Customer can choose colour on website)</span>
                  </label>
                  {colors.length > 0 && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                      {colors.length} color{colors.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  {['Black', 'White', 'Navy Blue', 'Blue', 'Red', 'Green', 'Pink', 'Grey', 'Brown', 'Beige', 'Yellow', 'Olive', 'Tan', 'Multicolor'].map((clr) => {
                    const active = colors.includes(clr)
                    return (
                      <button
                        key={clr}
                        type="button"
                        onClick={() => toggleColor(clr)}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {active && '✓ '}
                        {clr}
                      </button>
                    )
                  })}
                  <form onSubmit={addCustomColor} className="inline-flex gap-1 items-center">
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="+ Add Color"
                      className="text-xs py-1 px-2 border rounded-md w-24 bg-white"
                    />
                  </form>
                </div>
              </div>

              {/* EXTRACTED PRODUCT HIGHLIGHTS (MEESHO STYLE) */}
              {Object.keys(specifications).length > 0 && (
                <div className="bg-purple-50/40 p-3.5 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Auto-Extracted Product Highlights:
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold bg-purple-100/70 px-2 py-0.5 rounded-full">
                      Meesho Specs Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(specifications).slice(0, 8).map(([k, v]) => (
                      <div key={k} className="bg-white p-2 rounded-lg border border-purple-100/60 shadow-2xs">
                        <span className="text-[10px] text-gray-400 font-medium block">{k}</span>
                        <span className="text-xs text-gray-800 font-bold block truncate capitalize">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: THE FINAL 1-CLICK PUBLISH BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handle1ClickPublish}
                  disabled={publishing || !name.trim() || !sellNum}
                  className="w-full bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white text-sm py-3.5 px-6 rounded-xl font-black shadow-lg shadow-purple-200 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Publishing to Your Live Store...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>🚀 1-Click Import & Publish to Store Now &rarr;</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Immediately creates the product in its respective category, attaches all images, configures sizes, and makes it live for customers.
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
