import { useState, useEffect } from 'react'
import {
  Sparkles, X, Plus, Trash2, Upload, Download, CheckCircle,
  AlertCircle, TrendingUp, ArrowRight, ExternalLink, Layers, FileText
} from 'lucide-react'
import { productsAdminAPI, categoriesAPI } from '../../services/api'
import { formatPrice } from '../../utils/helpers'
import LoadingSpinner from '../ui/LoadingSpinner'
import { isCleanProductImage } from './MeeshoQuickImporterModal'
import toast from 'react-hot-toast'

// Intelligent Title & Keyword NLP Category Classifier
export function detectCategoryFromTitle(title = '', pageCategory = '', categories = []) {
  const t = (title || '').toLowerCase()
  const p = (pageCategory || '').toLowerCase()
  let targetSlug = ''

  // 1. Electronics & Audio Gadgets (Strict word boundaries, NO accidental bare "mic" or "stand")
  if (/\b(speaker|speakers|earphone|earphones|headphone|headphones|earbud|earbuds|airpod|airpods|tws|bluetooth|charger|usb|cable|adapter|neckband|power bank|soundbar|aux cable|mouse|keyboard|gadget|smart watch|smartwatch)\b/i.test(t) || /\b(mobile stand|laptop stand|phone stand|tablet stand|mobile holder|phone holder|tripod|selfie stick)\b/i.test(t) || (/\b(mic|microphone)\b/i.test(t) && !/\bmicrofib/i.test(t))) {
    targetSlug = 'electronics'
  }
  // 2. Home & Kitchen (Bedsheet, Cushion, Curtain, Clock, Cleaning Cloth, Mop, Plants, Cookware, etc.)
  else if (/\b(bedsheet|bed sheet|fitted sheet|pillow|cushion|curtain|blanket|quilt|dohar|comforter|mattress|towel|mop|cloth|microfiber|microfibre|cleaning cloth|cookware|pan|kadhai|bottle|clock|wall clock|sofa cover|chair cover|bangle stand|shoe rack|organizer|artificial plant|planter|kitchen|storage container|lunch box|decor|home decor|furnishing)\b/i.test(t)) {
    targetSlug = 'home-kitchen'
  }
  // 3. Watches (Analog / Formal)
  else if (/\b(watch|analog watch|digital watch|wrist watch|chronograph)\b/i.test(t)) {
    targetSlug = 'watches'
  }
  // 4. Footwear / Shoes / Slippers
  else if (/\b(shoe|shoes|sneaker|sneakers|loafer|loafers|sandal|sandals|flip flop|flip flops|slipper|slippers|chappal|chappals|crocs|slides|heel|heels|boots|footwear)\b/i.test(t)) {
    targetSlug = 'bags-footwear'
  }
  // 5. Bags & Wallets
  else if (/\b(bag|bags|handbag|handbags|backpack|backpacks|tote|purse|wallet|wallets|clutch|sling bag|luggage|duffle)\b/i.test(t)) {
    targetSlug = 'bags-footwear'
  }
  // 6. Jewellery & Accessories
  else if (/\b(jewel|jewellery|jewelry|necklace|earring|earrings|ring|rings|bangle|bangles|bracelet|bracelets|pendant|chain|anklet|mangalsutra|belt|belts|sunglasses|goggles|hair clip|scrunchie|rubber band|scarf|scarves|stole|stoles|dupatta)\b/i.test(t)) {
    targetSlug = 'jewellery-accessories'
  }
  // 7. Beauty & Health
  else if (/\b(lipstick|eyeliner|kajal|foundation|makeup|cream|lotion|serum|perfume|deo|shampoo|skincare|hair oil|trimmer|shaver)\b/i.test(t)) {
    targetSlug = 'beauty-health'
  }
  // 8. Kids & Toys
  else if (/\b(toy|toys|teddy|doll|dolls|playhouse|board game|puzzle|slime|clay|baby diaper|baby dress|infant|toddler)\b/i.test(t)) {
    targetSlug = 'kids-toys'
  }
  // 9. Indian Ethnic (Kurti, Saree, Lehenga)
  else if (/\b(saree|sari|sarees|kurti|kurtis|kurta|anarkali|lehenga|salwar|sharara|ethnic set|sherwani)\b/i.test(t)) {
    targetSlug = (/\b(men|boy|gents)\b/i.test(t)) ? 'men' : 'kurti-saree-lehenga'
  }
  // 10. Men's Clothing
  else if (/\b(men|man|gents|boy|boys)\b/i.test(t) && /\b(shirt|shirts|tshirt|t-shirt|pant|pants|trouser|trousers|jean|jeans|cargo|jogger|joggers|blazer|jacket|hoodie|boxer|underwear)\b/i.test(t)) {
    targetSlug = 'men'
  }
  // 11. Women Western Clothing
  else if (/\b(top|tops|crop top|tunic|dress|dresses|gown|gowns|skirt|skirts|jeans|jumpsuit|shrug|trousers|legging|leggings|jeggings|jacket|hoodie)\b/i.test(t)) {
    targetSlug = 'women-western'
  }
  // 12. Fallback to Meesho Page Category if matched
  else if (p) {
    const pcSlug = p.replace(/[^a-z0-9]+/g, '-')
    const match = categories.find(c => c.slug === pcSlug || c.slug.includes(pcSlug) || pcSlug.includes(c.slug))
    if (match) return match
  }

  if (targetSlug && categories.length > 0) {
    const matched = categories.find(c => c.slug === targetSlug) ||
                    categories.find(c => c.slug.includes(targetSlug) || targetSlug.includes(c.slug))
    if (matched) return matched
  }

  // Smart page-context default
  if (/home|kitchen/i.test(p)) {
    const hk = categories.find(c => c.slug === 'home-kitchen')
    if (hk) return hk
  }
  if (/electronic/i.test(p)) {
    const el = categories.find(c => c.slug === 'electronics')
    if (el) return el
  }
  if (/scarf|stole|jewel|accessor/i.test(p)) {
    const ja = categories.find(c => c.slug === 'jewellery-accessories')
    if (ja) return ja
  }

  return categories[0] || { id: 1, slug: 'home-kitchen', name: 'Home & Kitchen' }
}

export default function BulkProductImporterModal({ isOpen, onClose, onSuccess, initialBulkData }) {
  const [categories, setCategories] = useState([])
  const [tab, setTab] = useState('paste') // 'paste', 'grid', 'csv'
  const [parsing, setParsing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState(null)

  // Multi-paste text
  const [multiRawText, setMultiRawText] = useState('')
  const [globalMarkup, setGlobalMarkup] = useState('250')

  // Products staging list
  const [stagedProducts, setStagedProducts] = useState([])

  useEffect(() => {
    if (isOpen) {
      categoriesAPI.getAll(false).then(res => setCategories(res.data || [])).catch(() => {})
      // Initialize with 2 empty rows if empty and no initialBulkData
      if (stagedProducts.length === 0 && (!initialBulkData || initialBulkData.length === 0)) {
        setStagedProducts([
          createEmptyRow(1),
          createEmptyRow(2)
        ])
      }
    }
  }, [isOpen])

  // Handle incoming bulk data from 1-Click Page Grabber Bookmarklet
  useEffect(() => {
    if (isOpen && initialBulkData && initialBulkData.length > 0) {
      const markup = parseFloat(globalMarkup) || 250
      const formatted = initialBulkData.map((p, idx) => {
        // Prioritize exact Meesho card display price
        let cost = 0
        if (p.card_price && parseFloat(p.card_price) >= 49) {
          cost = parseFloat(p.card_price)
        } else if (p.purchase_cost && parseFloat(p.purchase_cost) >= 49) {
          cost = parseFloat(p.purchase_cost)
        } else if (p.price && parseFloat(p.price) >= 49) {
          cost = parseFloat(p.price)
        } else {
          cost = 199
        }

        const sell = cost + markup
        const orig = Math.round(sell * 1.5)
        
        // Accurate NLP Category Resolution from Title & Page Context
        const detectedCat = detectCategoryFromTitle(p.name || '', p.category || p.category_slug || '', categories)
        const catId = detectedCat?.id || (categories[0]?.id || 1)
        const catSlug = detectedCat?.slug || 'electronics'

        // Smart sizes based on category/title: Non-clothing items (speakers, earphones, watches, stands) NEVER get S/M/L
        const lowerName = (p.name || '').toLowerCase()
        const isNonClothing = /speaker|earphone|headphone|earbud|airpod|charger|usb|cable|stand|holder|tripod|watch|smartwatch|bottle|clock|curtain|bag|wallet|toy|toys|cream|makeup|perfume/i.test(lowerName) ||
                              catSlug === 'electronics' ||
                              catSlug === 'watches' ||
                              catSlug === 'home-kitchen' ||
                              catSlug === 'beauty-health'

        let itemSizes = ['Free Size']
        if (isNonClothing) {
          itemSizes = ['Free Size']
        } else if (/shoe|sneaker|footwear|sandal|flip flop|loafer|chappal/i.test(lowerName) || catSlug === 'bags-footwear') {
          itemSizes = ['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10']
        } else if (/jean|cargo|jogger|pant|trouser/i.test(lowerName)) {
          itemSizes = ['30', '32', '34', '36']
        } else if (/shirt|kurti|dress|tshirt|top|hoodie|jacket|kurta/i.test(lowerName) || catSlug === 'kurti-saree-lehenga' || catSlug === 'women-western' || catSlug === 'men') {
          itemSizes = ['S', 'M', 'L', 'XL', 'XXL']
        } else if (p.sizes && p.sizes.length > 0) {
          itemSizes = p.sizes
        }

        return {
          id: Date.now() + idx,
          name: p.name || `Meesho Product ${idx + 1}`,
          category_slug: catSlug,
          category_id: catId,
          purchase_cost: String(cost),
          selling_price: String(sell),
          original_price: String(orig),
          images: (p.images || (p.image ? [p.image] : [])).filter(isCleanProductImage),
          imageUrlInput: '',
          sizes: itemSizes,
          meesho_link: p.meesho_link || p.url || '',
          colors: p.colors || [],
          specifications: p.specifications || {},
          description: p.description || ''
        }
      })
      setStagedProducts(formatted)
      setTab('grid')
      toast.success(`🎉 ${formatted.length} Products grabbed from Meesho with all photos & specs!`)
    }
  }, [isOpen, initialBulkData, categories])

  if (!isOpen) return null

  function createEmptyRow(idx = 1) {
    return {
      id: Date.now() + idx,
      name: '',
      category_slug: 'mens-fashion',
      category_id: categories[0]?.id || 1,
      purchase_cost: '',
      selling_price: '',
      original_price: '',
      images: [],
      imageUrlInput: '',
      sizes: ['S', 'M', 'L', 'XL'],
      meesho_link: ''
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setMultiRawText(prev => prev ? `${prev}\n---\n${text}` : text)
        toast.success('Pasted text from clipboard!')
      }
    } catch {
      toast.error('Could not access clipboard. Please press Ctrl+V.')
    }
  }

  // Handle Multi-Link Parse
  const handleBulkParse = async () => {
    if (!multiRawText.trim()) {
      toast.error('Please paste at least one Meesho link or product text')
      return
    }

    setParsing(true)
    try {
      const res = await productsAdminAPI.bulkParseMeesho({
        raw_text: multiRawText.trim(),
        default_markup: parseFloat(globalMarkup) || 250
      })
      const items = res.data.items || []

      if (items.length === 0) {
        toast.error('No valid products detected. Please check your links/text.')
        return
      }

      const formatted = items.map((p, idx) => {
        const cost = p.purchase_cost || 0
        const sell = p.selling_price || (cost > 0 ? cost + (parseFloat(globalMarkup) || 250) : 599)
        const orig = p.original_price || (sell + 200)

        // Find category ID
        let catId = categories[0]?.id || 1
        if (p.category_slug) {
          const match = categories.find(c => c.slug === p.category_slug)
          if (match) catId = match.id
        }

        return {
          id: Date.now() + idx,
          name: p.name || `Meesho Product ${idx + 1}`,
          category_slug: p.category_slug || 'mens-fashion',
          category_id: catId,
          purchase_cost: cost ? String(cost) : '',
          selling_price: String(sell),
          original_price: String(orig),
          images: (p.images || []).filter(isCleanProductImage),
          imageUrlInput: '',
          sizes: p.sizes?.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL'],
          meesho_link: p.meesho_link || ''
        }
      })

      setStagedProducts(formatted)
      setTab('grid') // switch to review table
      toast.success(`Successfully parsed ${formatted.length} products! Review and publish below.`)
    } catch {
      toast.error('Failed to parse input. You can enter details in the table.')
    } finally {
      setParsing(false)
    }
  }

  // Apply global markup to all rows
  const applyGlobalMarkup = () => {
    const markup = parseFloat(globalMarkup) || 0
    if (markup <= 0) {
      toast.error('Please enter a valid markup amount (e.g. 250)')
      return
    }

    setStagedProducts(prev => prev.map(p => {
      const cost = parseFloat(p.purchase_cost) || 0
      if (cost > 0) {
        const sell = cost + markup
        return {
          ...p,
          selling_price: String(sell),
          original_price: String(sell + 200)
        }
      }
      return p
    }))
    toast.success(`Applied ₹${markup} profit markup to all products!`)
  }

  // Row update helpers
  const updateRow = (id, field, value) => {
    setStagedProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value }
        // Auto-calc sell price if cost changed and sell is empty
        if (field === 'purchase_cost' && (!p.selling_price || parseFloat(p.selling_price) <= 0)) {
          const cost = parseFloat(value) || 0
          if (cost > 0) {
            const sell = cost + (parseFloat(globalMarkup) || 250)
            updated.selling_price = String(sell)
            updated.original_price = String(sell + 200)
          }
        }
        return updated
      }
      return p
    }))
  }

  const removeRow = (id) => {
    setStagedProducts(prev => prev.filter(p => p.id !== id))
  }

  const addNewRow = () => {
    setStagedProducts(prev => [...prev, createEmptyRow(prev.length + 1)])
  }

  // CSV Template download
  const downloadSampleCsv = () => {
    const csvContent = `Product Name,Meesho Cost,Selling Price,Category,Image URL,Sizes
Men Slim Fit Cotton Shirt,280,599,mens-fashion,https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600,S;M;L;XL
Women Pure Cotton Kurta Set,420,899,womens-fashion,https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600,M;L;XL
Breathable Running Sports Shoes,340,699,footwear,https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600,UK 6;UK 7;UK 8;UK 9`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'shopezy_bulk_products_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // CSV file parse
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 2) {
          toast.error('CSV file is empty or missing headers')
          return
        }

        const parsed = []
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim())
          if (parts.length >= 2 && parts[0]) {
            const name = parts[0]
            const cost = parseFloat(parts[1]) || 0
            const sell = parseFloat(parts[2]) || (cost + 250)
            const catSlug = parts[3] || 'mens-fashion'
            const imgUrl = parts[4] || ''
            const sizesStr = parts[5] || 'S;M;L;XL'
            const sizes = sizesStr.split(';').map(s => s.trim()).filter(Boolean)

            let catId = categories[0]?.id || 1
            const match = categories.find(c => c.slug === catSlug)
            if (match) catId = match.id

            parsed.push({
              id: Date.now() + i,
              name,
              category_slug: catSlug,
              category_id: catId,
              purchase_cost: cost ? String(cost) : '',
              selling_price: String(sell),
              original_price: String(sell + 200),
              images: imgUrl ? [imgUrl] : [],
              imageUrlInput: '',
              sizes: sizes.length > 0 ? sizes : ['Free Size'],
              meesho_link: ''
            })
          }
        }

        if (parsed.length > 0) {
          setStagedProducts(parsed)
          setTab('grid')
          toast.success(`Loaded ${parsed.length} products from CSV! Ready to publish.`)
        } else {
          toast.error('Could not find valid product rows in CSV')
        }
      } catch {
        toast.error('Failed to parse CSV file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Execute 1-Click Bulk Publish
  const handleBulkPublish = async () => {
    // Validate
    const validProducts = stagedProducts.filter(p => p.name.trim() && parseFloat(p.selling_price) > 0)
    if (validProducts.length === 0) {
      toast.error('Please ensure at least one product has a title and selling price')
      return
    }

    setPublishing(true)
    try {
      const payload = {
        products: validProducts.map(p => ({
          name: p.name.trim(),
          category_id: parseInt(p.category_id) || undefined,
          category_slug: p.category_slug,
          purchase_cost: parseFloat(p.purchase_cost) || 0.0,
          selling_price: parseFloat(p.selling_price),
          original_price: parseFloat(p.original_price) || (parseFloat(p.selling_price) + 200),
          images: (p.images || []).filter(isCleanProductImage),
          sizes: p.sizes,
          colors: p.colors || [],
          specifications: p.specifications || {},
          description: p.description || undefined,
          is_active: true,
          cod_available: true,
          stock_quantity: 100,
          meesho_link: p.meesho_link || undefined
        }))
      }

      const res = await productsAdminAPI.bulkPublish(payload)
      setResult(res.data)
      toast.success(`🎉 ${res.data.count} products successfully published in 1 click!`)
      if (onSuccess) onSuccess()
    } catch (err) {
      const msg = Array.isArray(err.response?.data?.detail)
        ? err.response.data.detail.map(d => d.msg).join(', ')
        : (typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Failed to bulk publish products')
      toast.error(msg)
    } finally {
      setPublishing(false)
    }
  }

  // Summary counts
  const validCount = stagedProducts.filter(p => p.name.trim() && parseFloat(p.selling_price) > 0).length
  const totalCost = stagedProducts.reduce((sum, p) => sum + (parseFloat(p.purchase_cost) || 0), 0)
  const totalSell = stagedProducts.reduce((sum, p) => sum + (parseFloat(p.selling_price) || 0), 0)
  const totalExpectedProfit = totalSell - totalCost

  // 1-Click Deep Page Bulk Grabber: Scans full inner photos, specs & sizes for all products scrolled into view (up to 100 items)
  const bulkBookmarkletCode = `javascript:(function(){try{var cards=Array.from(document.querySelectorAll('a[href*="/p/"]'));if(!cards||cards.length===0){cards=Array.from(document.querySelectorAll('div[class*="ProductCard"],div[class*="Card"]')).filter(function(c){return c.querySelector('img')&&c.innerText.includes('₹');});}if(!cards||cards.length===0){alert('Koi Meesho products nahi mile is page par! Kripya kisi collection ya category page (jaise Scarves, Summer Picks, Kurtis) par chalayein.');return;}var pageCat=document.querySelector('h1')?.innerText||document.title.split('|')[0].trim()||'Meesho Collection';var getCardText=function(el){if(el.innerText&&el.innerText.includes('₹'))return el.innerText;var p1=el.parentElement;if(p1&&p1.innerText&&p1.innerText.includes('₹'))return p1.innerText;var p2=p1?p1.parentElement:null;if(p2&&p2.innerText&&p2.innerText.includes('₹'))return p2.innerText;var p3=p2?p2.parentElement:null;if(p3&&p3.innerText&&p3.innerText.includes('₹'))return p3.innerText;return el.innerText||'';};var uniqueCards=[];var seenHrefs={};cards.forEach(function(c){var linkEl=c.tagName==='A'?c:c.querySelector('a[href*="/p/"]');var h=linkEl?linkEl.href:'';if(h&&h.includes('/p/')&&!seenHrefs[h]){seenHrefs[h]=true;var cardPrice=0;try{var cText=getCardText(c);var cpm=cText.match(/₹\\s*([0-9]{2,5}(?:,[0-9]+)?)/);if(cpm){var parsed=parseFloat(cpm[1].replace(/,/g,''));if(parsed>=49)cardPrice=parsed;}}catch(ce){}uniqueCards.push({card:c,href:h,cardPrice:cardPrice});}});if(uniqueCards.length===0){alert('Products nahi mile is page par.');return;}var total=Math.min(uniqueCards.length,100);var listToScan=uniqueCards.slice(0,total);var oldBox=document.getElementById('shopezy-scanner-overlay');if(oldBox)oldBox.remove();var box=document.createElement('div');box.id='shopezy-scanner-overlay';box.setAttribute('style','position:fixed;top:24px;right:24px;z-index:9999999;background:#18181b;color:#fff;padding:20px 24px;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);font-family:system-ui,-apple-system,sans-serif;width:340px;border:1.5px solid #9333ea;');box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="background:#7e22ce;color:#fff;width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;">⚡</div><div><div style="font-weight:900;font-size:13px;letter-spacing:-0.2px;">ShopEzy Deep Bulk Grabber</div><div style="font-size:11px;color:#a1a1aa;">Extracting all photos, specs & sizes...</div></div></div><div style="background:#27272a;height:8px;border-radius:4px;overflow:hidden;margin:12px 0 8px;"><div id="shopezy-pbar" style="background:linear-gradient(to right,#a855f7,#ec4899);height:100%;width:0%;transition:width 0.25s;"></div></div><div id="shopezy-status" style="font-size:11px;color:#d8b4fe;font-weight:700;">Starting deep scan (0/'+total+')...</div><div id="shopezy-action-box"></div>';document.body.appendChild(box);var updateProgress=function(done){var pct=Math.round((done/total)*100);var pbar=document.getElementById('shopezy-pbar');var st=document.getElementById('shopezy-status');if(pbar)pbar.style.width=pct+'%';if(st)st.innerText='Extracting product details ('+done+'/'+total+') - '+pct+'%';};var items=[];var completed=0;var cleanImg=function(u){if(!u||typeof u!=='string'||!u.startsWith('http'))return'';if(u.indexOf('images.meesho.com')!==-1&&u.indexOf('/products/')===-1)return'';if(/(banner|offer|promo|download|app_download|campaign|strip|badge|coupon|supplier|header|footer|35%|35_off|marketing|growth|pow|widgets)/i.test(u))return'';return u.replace(/_[0-9]+\\.(jpg|webp|jpeg)/i,'.jpg');};var scanSingle=function(itemObj){var cardPrice=itemObj.cardPrice||0;return fetch(itemObj.href).then(function(res){return res.text();}).then(function(html){var title='';var images=[];var sizes=[];var specs={};var jsonMatches=html.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/gi)||[];for(var i=0;i<jsonMatches.length;i++){try{var rawJson=jsonMatches[i].replace(/<script[^>]*>|<\\/script>/gi,'');var j=JSON.parse(rawJson);var jd=Array.isArray(j)?j[0]:j;if(jd&&(jd['@type']==='Product'||jd.name)){if(jd.name)title=jd.name.trim();if(jd.image){var jImgs=Array.isArray(jd.image)?jd.image:[jd.image];jImgs.forEach(function(u){var c=cleanImg(u);if(c&&images.indexOf(c)===-1)images.push(c);});}break;}}catch(e){}}if(!title){var mPath=itemObj.href.split('/p/')[0].split('/').pop();if(mPath)title=mPath.replace(/[-_]+/g,' ').replace(/\\b\\w/g,function(l){return l.toUpperCase();});}var cost=cardPrice>=49?cardPrice:0;if(!cost){for(var i=0;i<jsonMatches.length;i++){try{var j=JSON.parse(jsonMatches[i].replace(/<script[^>]*>|<\\/script>/gi,''));var jd=Array.isArray(j)?j[0]:j;if(jd&&jd.offers&&jd.offers.price&&parseFloat(jd.offers.price)>=49){cost=parseFloat(jd.offers.price);break;}}catch(e){}}}if(!cost||cost<49){var mm=html.match(/<meta\\s+property="(?:product:price:amount|og:price:amount)"\\s+content="([0-9]+(?:\\.[0-9]+)?)"/i);if(mm&&parseFloat(mm[1])>=49)cost=parseFloat(mm[1]);}if(!cost||cost<49)cost=199;var imgMatches=html.match(/https:\\/\\/images\\.meesho\\.com\\/images\\/products\\/[a-zA-Z0-9_\\/]+\\.(jpg|webp|jpeg)/gi)||[];imgMatches.forEach(function(u){var c=cleanImg(u);if(c&&images.indexOf(c)===-1&&images.length<5)images.push(c);});var isTechOrGadget=/speaker|earphone|headphone|earbud|airpod|tws|bluetooth|charger|usb|cable|adapter|neckband|power bank|mic|modesk|stand|holder|tripod|aux|soundbar|mouse|keyboard|gadget|watch|smartwatch/i.test(title||pageCat);var sizes=[];if(isTechOrGadget){sizes=['Free Size'];}else{var sizeMatches=html.match(/\\b(IND-\\d+|UK-\\d+|XS|S|M|L|XL|XXL|3XL|Free Size)\\b/gi)||[];sizeMatches.forEach(function(s){var up=s.toUpperCase();if(sizes.indexOf(up)===-1&&sizes.length<6)sizes.push(up);});}['Pattern','Fabric','Material','Type','Sole Material','Occasion'].forEach(function(sk){var sm=html.match(new RegExp(sk+'\\\\s*:\\\\s*([^<\\\\n\\\\r"]+)','i'));if(sm&&sm[1]&&sm[1].trim().length<40)specs[sk]=sm[1].trim();});if(images.length===0){var cImg=itemObj.card.querySelector('img');if(cImg&&cImg.src){var c=cleanImg(cImg.src);if(c)images.push(c);}}return{name:title||(pageCat+' Item'),purchase_cost:cost,card_price:cardPrice||cost,meesho_link:itemObj.href,category:pageCat,images:images.slice(0,5),sizes:sizes.length?sizes:['Free Size'],specifications:specs};}).catch(function(){var cImg=itemObj.card.querySelector('img');var imgSrc=cImg?cleanImg(cImg.src):'';var fallbackCost=cardPrice>=49?cardPrice:199;return{name:pageCat+' Product',purchase_cost:fallbackCost,card_price:fallbackCost,meesho_link:itemObj.href,category:pageCat,images:imgSrc?[imgSrc]:[],sizes:['Free Size'],specifications:{}};}).then(function(prod){items.push(prod);completed++;updateProgress(completed);});};var runBatch=function(index){if(index>=listToScan.length){var pbar=document.getElementById('shopezy-pbar');if(pbar)pbar.style.width='100%';var st=document.getElementById('shopezy-status');if(st)st.innerText='🎉 All '+items.length+' products extracted!';var compressAndRedirect=function(targetBlank){var jsonStr=JSON.stringify(items);try{var stream=new Blob([jsonStr]).stream();var compressedStream=stream.pipeThrough(new CompressionStream('gzip'));new Response(compressedStream).blob().then(function(b){return b.arrayBuffer();}).then(function(buf){var binary='';var bytes=new Uint8Array(buf);for(var i=0;i<bytes.byteLength;i++)binary+=String.fromCharCode(bytes[i]);var b64=btoa(binary).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');var targetUrl='${window.location.origin}/admin/products?bulkGzip='+b64;if(targetBlank){window.open(targetUrl,'_blank');}else{window.location.href=targetUrl;}}).catch(function(){window.location.href='${window.location.origin}/admin/products?bulkImportData='+encodeURIComponent(jsonStr);});}catch(e){window.location.href='${window.location.origin}/admin/products?bulkImportData='+encodeURIComponent(jsonStr);}};var abox=document.getElementById('shopezy-action-box');if(abox){abox.innerHTML='<div style="margin-top:12px;"><button id="shopezy-open-btn" style="width:100%;background:linear-gradient(to right,#a855f7,#7e22ce);color:#fff;font-weight:900;font-size:13px;padding:12px;border:none;border-radius:12px;cursor:pointer;box-shadow:0 8px 16px rgba(147,51,234,0.4);display:block;margin-bottom:8px;">🚀 Open ShopEzy ('+items.length+' Products)</button><button id="shopezy-close-btn" style="background:transparent;border:none;color:#a1a1aa;font-size:11px;cursor:pointer;width:100%;text-align:center;">Close</button></div>';var btn=document.getElementById('shopezy-open-btn');if(btn)btn.onclick=function(){compressAndRedirect(false);};var cBtn=document.getElementById('shopezy-close-btn');if(cBtn)cBtn.onclick=function(){document.getElementById('shopezy-scanner-overlay')?.remove();};}compressAndRedirect(false);return;}var batch=listToScan.slice(index,index+4);Promise.all(batch.map(scanSingle)).then(function(){runBatch(index+4);});};runBatch(0);}catch(err){alert('Error: '+err.message);}})();`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-100 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-brand-800 to-purple-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Layers className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">⚡ 1-Click Bulk Product Importer</h2>
              <p className="text-xs text-purple-200">List 5, 10 or 20 products from Meesho or CSV simultaneously into your store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Result Celebratory Screen */}
        {result ? (
          <div className="p-10 text-center space-y-5 animate-fade-in my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <span className="badge badge-success text-xs font-bold px-3 py-1 mb-2 inline-block">
                Bulk Listing Complete
              </span>
              <h3 className="text-2xl font-black text-gray-900">
                {result.count} Products Published Live!
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                All selected products have been added to your catalog with images, categories, variant sizes, and Cash on Delivery enabled.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <a
                href="/products"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs py-2.5 px-6 font-bold inline-flex items-center justify-center gap-2 shadow-brand"
              >
                <ExternalLink className="w-4 h-4" /> View Products on Storefront
              </a>
              <button
                onClick={() => { setResult(null); onClose(); }}
                className="btn-secondary text-xs py-2.5 px-6 font-bold"
              >
                Close Importer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Toolbar / Method Selector */}
            <div className="bg-purple-50/70 border-b border-purple-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-xl bg-white p-1 border border-purple-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setTab('paste')}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                    tab === 'paste' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  1. Paste Multi-Meesho Links
                </button>
                <button
                  type="button"
                  onClick={() => setTab('grid')}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                    tab === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  2. Review & Edit Products ({stagedProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab('csv')}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                    tab === 'csv' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  3. Excel / CSV Upload
                </button>
              </div>

              {/* Global Markup Tool */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-purple-200">
                <span className="text-[11px] font-bold text-gray-700">Global Markup:</span>
                <div className="relative w-20">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={globalMarkup}
                    onChange={(e) => setGlobalMarkup(e.target.value)}
                    className="w-full text-xs font-black pl-5 pr-1 py-1 border rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyGlobalMarkup}
                  className="btn-secondary text-[10px] py-1 px-2.5 font-bold"
                  title="Apply this profit markup to all products with cost"
                >
                  Apply All
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* ⚡ 1-Click Meesho Page Bulk Grabber Banner */}
              <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Layers className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      ⚡ 1-Click Meesho Page Bulk Grabber Bookmarklet
                      <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">Recommended</span>
                    </span>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Drag this button to your Bookmarks Bar (Ctrl+Shift+B). On any Meesho page (Scarves, Summer Picks, Kurtis), click it once to grab all 20-35 products at once!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={bulkBookmarkletCode}
                    onClick={(e) => {
                      if (e.button === 0) {
                        toast('📌 Is button ko apne Chrome/Edge Bookmarks bar (Ctrl+Shift+B) me drag & drop karein!', { icon: '💡' })
                      }
                    }}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
                    title="Drag this button to your Bookmarks Bar (Ctrl+Shift+B)"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>⚡ Bulk Grab Meesho Page</span>
                  </a>
                </div>
              </div>
              
              {/* TAB 1: PASTE MULTI-LINKS */}
              {tab === 'paste' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Bulk Link Paste Guide:
                    </p>
                    <p className="text-[11px] text-purple-800">
                      You can paste 5, 10 or 20 Meesho product URLs or WhatsApp descriptions at once. Paste them separated by new lines or <code className="bg-white px-1 rounded border">---</code>.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700 block">
                        Paste Meesho URLs or Descriptions:
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="text-[11px] text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
                      >
                        📋 Paste from Clipboard
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={multiRawText}
                      onChange={(e) => setMultiRawText(e.target.value)}
                      placeholder={`https://www.meesho.com/s/p/abc123\nhttps://www.meesho.com/s/p/xyz456\n---\nProduct Name: Floral Cotton Kurti\nPrice: Rs. 380\nSizes: M, L, XL`}
                      className="input-field text-xs font-mono resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-gray-400">
                      Auto-extracts titles, costs, sizes & photos
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkParse}
                      disabled={parsing || !multiRawText.trim()}
                      className="btn-primary text-xs py-2.5 px-6 font-black shadow-brand flex items-center gap-2"
                    >
                      {parsing ? <LoadingSpinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                      Parse & Load into Table
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EDITABLE BATCH TABLE */}
              {tab === 'grid' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-gray-900">
                        Products Ready for Publishing ({validCount} Valid)
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Edit titles, verify selling prices, or change categories before publishing.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addNewRow}
                      className="btn-secondary text-xs py-1.5 px-3 font-bold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3 w-16">Image</th>
                            <th className="py-2.5 px-3 min-w-[200px]">Product Title *</th>
                            <th className="py-2.5 px-3 w-36">Category</th>
                            <th className="py-2.5 px-3 w-24">Meesho Cost</th>
                            <th className="py-2.5 px-3 w-28 text-brand-700">Selling Price *</th>
                            <th className="py-2.5 px-3 w-24 text-emerald-700">Profit</th>
                            <th className="py-2.5 px-3 min-w-[140px]">Sizes</th>
                            <th className="py-2.5 px-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {stagedProducts.map((p, idx) => {
                            const cost = parseFloat(p.purchase_cost) || 0
                            const sell = parseFloat(p.selling_price) || 0
                            const profit = sell - cost

                            return (
                              <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                                {/* Image preview or quick URL */}
                                <td className="py-2 px-3">
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                    {p.images?.[0] ? (
                                      <img src={p.images[0]} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] text-gray-400 font-bold">Auto</span>
                                    )}
                                    {p.images?.length > 1 && (
                                      <span className="absolute bottom-0 right-0 bg-purple-900/90 text-white text-[8px] font-black px-1 rounded-tl-md" title={`${p.images.length} photos extracted`}>
                                        {p.images.length}📷
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Name */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={p.name}
                                    onChange={(e) => updateRow(p.id, 'name', e.target.value)}
                                    placeholder="Product title..."
                                    className="w-full text-xs font-semibold py-1 px-2 border rounded-md"
                                  />
                                </td>

                                {/* Category */}
                                <td className="py-2 px-3">
                                  <select
                                    value={p.category_id}
                                    onChange={(e) => {
                                      const cat = categories.find(c => String(c.id) === e.target.value)
                                      updateRow(p.id, 'category_id', e.target.value)
                                      if (cat) updateRow(p.id, 'category_slug', cat.slug)
                                    }}
                                    className="w-full text-xs py-1 px-2 border rounded-md"
                                  >
                                    {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Meesho Cost */}
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    value={p.purchase_cost}
                                    onChange={(e) => updateRow(p.id, 'purchase_cost', e.target.value)}
                                    placeholder="Cost"
                                    className="w-full text-xs font-semibold py-1 px-2 border rounded-md"
                                  />
                                </td>

                                {/* Selling Price */}
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    value={p.selling_price}
                                    onChange={(e) => updateRow(p.id, 'selling_price', e.target.value)}
                                    placeholder="Sell ₹"
                                    className="w-full text-xs font-black text-brand-600 py-1 px-2 border border-brand-300 rounded-md bg-purple-50/30"
                                  />
                                </td>

                                {/* Profit */}
                                <td className="py-2 px-3">
                                  <span className={`font-black text-xs ${profit > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    {profit > 0 ? `+${formatPrice(profit)}` : '—'}
                                  </span>
                                </td>

                                {/* Sizes */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={p.sizes.join(', ')}
                                    onChange={(e) => updateRow(p.id, 'sizes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="S, M, L, XL..."
                                    className="w-full text-[11px] py-1 px-2 border rounded-md font-mono"
                                  />
                                </td>

                                {/* Delete row */}
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeRow(p.id)}
                                    className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CSV UPLOAD */}
              {tab === 'csv' && (
                <div className="space-y-5 max-w-xl mx-auto py-4">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center space-y-2">
                    <FileText className="w-8 h-8 text-purple-600 mx-auto" />
                    <h4 className="text-xs font-black text-purple-900">Upload CSV / Excel Spreadsheet</h4>
                    <p className="text-[11px] text-purple-700">
                      Upload a CSV file containing your product names, costs, selling prices, and image URLs.
                    </p>
                    <button
                      type="button"
                      onClick={downloadSampleCsv}
                      className="btn-secondary text-[11px] py-1.5 px-3 font-bold inline-flex items-center gap-1.5 mt-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <label htmlFor="csv-file-input" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-700">Click to upload your .CSV spreadsheet</p>
                      <p className="text-[10px] text-gray-400 mt-1">Supports any spreadsheet with standard headers</p>
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer & 1-Click Final Button */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                <span>Selected: <strong className="text-gray-900 font-bold">{validCount} Products</strong></span>
                {totalExpectedProfit > 0 && (
                  <span className="ml-3 text-emerald-600 font-bold">
                    Total Estimated Profit: +{formatPrice(totalExpectedProfit)}
                  </span>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs py-2.5 px-4 font-bold flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkPublish}
                  disabled={publishing || validCount === 0}
                  className="bg-gradient-to-r from-purple-700 to-brand-600 hover:from-purple-800 hover:to-brand-700 text-white text-xs py-2.5 px-6 rounded-xl font-black shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                >
                  {publishing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Publishing {validCount} Products...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>🚀 1-Click Publish All ({validCount}) to Store</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

