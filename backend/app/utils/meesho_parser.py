import re
from urllib.parse import urlparse
from typing import Dict, Any, List

CATEGORY_FALLBACK_IMAGES = {
    "kurti-saree-lehenga": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    "women-western": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    "lingerie": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    "men": "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80",
    "kids-toys": "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
    "home-kitchen": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
    "beauty-health": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
    "jewellery-accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "bags-footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "electronics": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "watches": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "sports-fitness": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    # Backward compatibility
    "mens-fashion": "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80",
    "womens-fashion": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    "footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "kids-fashion": "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
    "accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "beauty-lifestyle": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
}

KEYWORD_SPECIFIC_IMAGES = [
    (['gym', 'sport', 'jogger', 'fitness', 'track'], "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"),
    (['shoe', 'sneaker', 'running', 'footwear', 'loafer'], "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"),
    (['saree', 'silk', 'kanjivaram'], "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"),
    (['kurti', 'anarkali', 'lehenga', 'suit'], "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"),
    (['shirt', 'cotton', 'formal'], "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"),
    (['tshirt', 't-shirt', 'round neck'], "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"),
    (['watch', 'analog', 'smartwatch'], "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"),
    (['earbuds', 'earphone', 'headphone', 'audio', 'speaker'], "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"),
    (['bottle', 'chopper', 'cookware', 'kitchen'], "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80"),
]

def map_meesho_category(text: str) -> str:
    """
    Directly maps Meesho product categories, breadcrumbs and titles to ShopEzy categories.
    Accurately handles ethnic wear, footwear/shoes, women, men, kids, watches, electronics, etc.
    """
    t = text.lower()
    
    # 1. Sarees, Kurtis & Indian Ethnic (High priority)
    if any(k in t for k in ['saree', 'sari', 'kurti', 'kurta set', 'anarkali', 'lehenga', 'chaniya choli', 'dupatta', 'salwar', 'suit material', 'sharara', 'gharara', 'chunri', 'petticoat', 'blouse piece']):
        if re.search(r'\b(men|boys?|gents)\b', t) and any(k in t for k in ['kurta', 'sherwani', 'dhoti', 'pyjama']):
            return "men"
        return "kurti-saree-lehenga"

    # 2. Footwear, Shoes, Slippers & Bags (Always priority over generic gender words)
    if any(k in t for k in ['shoe', 'sneaker', 'sandal', 'slipper', 'chappal', 'boot', 'footwear', 'loafer', 'crocs', 'heel', 'flat', 'mojari', 'flip flop', 'bag', 'backpack', 'handbag', 'tote', 'duffle', 'luggage', 'sling bag', 'clutch', 'wallet']):
        return "bags-footwear"

    # 3. Lingerie, Sleepwear & Innerwear
    if any(k in t for k in ['bra', 'panty', 'panties', 'lingerie', 'nighty', 'nightwear', 'sleepwear', 'babydoll', 'boxer', 'brief', 'camisole']):
        return "lingerie"

    # 4. Watches & Smartwatches
    if any(k in t for k in ['watch', 'smartwatch', 'analog watch', 'digital watch', 'chronograph']):
        return "watches"

    # 5. Electronics & Audio
    if any(k in t for k in ['earphone', 'headphone', 'earbud', 'airpod', 'tws', 'bluetooth', 'speaker', 'charger', 'usb cable', 'mobile cover', 'mobile case', 'power bank', 'tempered glass', 'neckband']):
        return "electronics"

    # 6. Jewellery & Fashion Accessories
    if any(k in t for k in ['jewel', 'necklace', 'earring', 'bangle', 'ring', 'pendant', 'chain', 'mangalsutra', 'bracelet', 'anklet', 'payal', 'jhumka', 'sunglass', 'goggles', 'hair accessory']):
        return "jewellery-accessories"

    # 7. Kids, Toddlers & Toys (Detects boys, girls, frock, toy, baby)
    if any(k in t for k in ['kid', 'baby', 'toy', 'infant', 'toddler', 'doll', 'diaper', 'romper', 'frock', 'children', 'child']) or (re.search(r'\b(boys?|girls?)\b', t) and any(k in t for k in ['wear', 'cloth', 'frock', 'dress', 'set', 'suit', 'tshirt', 'shirt', 'shorts'])):
        return "kids-toys"

    # 8. Home & Kitchen
    if any(k in t for k in ['kitchen', 'home', 'bottle', 'chopper', 'bedsheet', 'curtain', 'cookware', 'utensil', 'pillow', 'blanket', 'storage', 'mop', 'lunch box', 'flask', 'towel', 'pan', 'kadhai', 'container']):
        return "home-kitchen"

    # 9. Beauty, Skincare & Grooming
    if any(k in t for k in ['beauty', 'cream', 'perfume', 'deodorant', 'makeup', 'serum', 'lotion', 'lipstick', 'skincare', 'hair oil', 'shampoo', 'facewash', 'eyeliner', 'nail polish', 'kajal', 'foundation', 'eyeshadow']):
        return "beauty-health"

    # 10. Sports & Fitness
    if any(k in t for k in ['gym', 'dumbbell', 'yoga mat', 'fitness', 'exercise', 'resistance band', 'shaker bottle', 'sports equipment']):
        return "sports-fitness"

    # 11. Women Western Wear (T-shirts, Jeans, Tops, Dresses for Women/Girls/Ladies)
    is_female = bool(re.search(r'\b(women|woman|ladies|girls?|female)\b', t))
    if is_female and any(k in t for k in ['dress', 'western', 'top', 'tunic', 'jumpsuit', 'gown', 'skirt', 'crop top', 'shirt', 'tshirt', 't-shirt', 'jean', 'jeans', 'trouser', 'cargo', 'jogger', 'palazzo', 'plazo', 'shorts', 'hoodie', 'jacket', 'blazer']):
        return "women-western"
    if any(k in t for k in ['dress', 'western', 'top', 'tunic', 'jumpsuit', 'gown', 'skirt', 'crop top', 'palazzo', 'plazo']):
        return "women-western"

    # 12. Men Apparel
    if any(k in t for k in ['men', 'shirt', 'tshirt', 't-shirt', 'polo', 'jeans', 'trouser', 'cargo', 'jogger', 'hoodie', 'jacket', 'blazer', 'track pant', 'chinos', 'kurta men']):
        return "men"

    return "men"


def parse_meesho_data(raw_input: str, meesho_cost: float = None, margin_percent: float = 60.0) -> Dict[str, Any]:
    """
    Intelligently parses Meesho product link or Meesho shared product description.
    Extracts title, suggested category, sizes, specifications, purchase cost, and recommended selling price.
    """
    raw_input = raw_input.strip()
    result = {
        "name": "",
        "category_slug": "men",
        "description": "",
        "purchase_cost": 0.0,
        "selling_price": 0.0,
        "original_price": 0.0,
        "discount_percentage": 40.0,
        "meesho_link": "",
        "sizes": [],
        "colors": [],
        "specifications": {},
        "images": []
    }

    # 1. Check if input contains a URL or image URLs
    url_match = re.search(r'https?://[^\s]+meesho\.com[^\s]*', raw_input, re.IGNORECASE)
    if url_match:
        url = url_match.group(0).rstrip('.,;)')
        result["meesho_link"] = url
        
        parsed_url = urlparse(url)
        path_parts = [p for p in parsed_url.path.split('/') if p]
        
        # e.g., /men-lightweight-breathable-mesh-running-sports-shoes/p/gtq4o4
        for part in path_parts:
            if part not in ['p', 's', 'catalog', 'product', 'd'] and len(part) > 3 and not re.match(r'^[a-z0-9]{5,10}$', part):
                clean_title = part.replace('-', ' ').replace('_', ' ').title()
                result["name"] = clean_title
                break

    # Extract any real image URLs in text (meesho CDN, unsplash, jpg, png, webp)
    image_regex = r'https?://[^\s]+(?:\.jpg|\.jpeg|\.png|\.webp|images\.meesho\.com[^\s]+)[^\s]*'
    found_images = re.findall(image_regex, raw_input, re.IGNORECASE)
    for img in found_images:
        clean_img = img.rstrip('.,;)"\'')
        if clean_img not in result["images"] and "meesho.com/p/" not in clean_img:
            result["images"].append(clean_img)

    # 2. Extract structured fields from shared Meesho text
    name_match = re.search(r'(?:Name|Product\s*Name|Title)\s*:\s*([^\n\r]+)', raw_input, re.IGNORECASE)
    if name_match:
        result["name"] = name_match.group(1).strip()

    # Category extraction from text if explicitly provided
    cat_match = re.search(r'(?:Category|Breadcrumbs?|Department|Collection)\s*[:=]?\s*([^\n\r]+)', raw_input, re.IGNORECASE)
    explicit_category = cat_match.group(1).strip() if cat_match else ""

    # Price / Cost extraction
    price_found = None
    labeled_price = re.search(r'(?:Price|Cost|Rate|Meesho\s*Price)\s*[:=]?\s*(?:₹|Rs\.?|INR)?\s*([0-9]{2,5}(?:\.[0-9]+)?)', raw_input, re.IGNORECASE)
    if labeled_price:
        try:
            price_found = float(labeled_price.group(1))
        except ValueError:
            pass

    if not price_found:
        sym_prices = re.findall(r'(?:₹|Rs\.?|INR)\s*([0-9]{2,5}(?:\.[0-9]+)?)', raw_input, re.IGNORECASE)
        if sym_prices:
            try:
                valid_syms = [float(p) for p in sym_prices if 40 <= float(p) <= 25000]
                if valid_syms:
                    price_found = min(valid_syms)
            except ValueError:
                pass

    if not price_found:
        slash_match = re.search(r'\b([1-9][0-9]{1,4})\s*/-', raw_input)
        if slash_match:
            try:
                price_found = float(slash_match.group(1))
            except ValueError:
                pass

    if price_found:
        result["purchase_cost"] = price_found

    # Explicit user cost overrides everything
    if meesho_cost and meesho_cost > 0:
        result["purchase_cost"] = float(meesho_cost)

    # If title not found yet, use first line or fallback
    if not result["name"]:
        first_line = raw_input.split('\n')[0].strip()
        if first_line and not first_line.startswith('http'):
            result["name"] = first_line[:120]
        else:
            result["name"] = "Trendy Meesho Sourced Product"

    # Category Mapping: Use explicit category first, or map product title + input
    target_category_source = (explicit_category + " " + result["name"] + " " + raw_input).strip()
    result["category_slug"] = map_meesho_category(target_category_source)

    # Specifications extraction
    spec_patterns = [
        "Fabric", "Pattern", "Fit", "Sleeve Length", "Collar", "Length",
        "Neck", "Closure", "Occasion", "Material", "Color", "Type", "Sole Material"
    ]
    for spec in spec_patterns:
        m = re.search(rf'{spec}\s*:\s*([^\n\r]+)', raw_input, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            result["specifications"][spec] = val
            if spec.lower() == "color" and val:
                result["colors"] = [c.strip() for c in val.split('/')]

    # Sizes extraction - support Indian shoe sizes IND-6..10, waist sizes 28..40, and apparel S..XXL
    found_sizes = []
    lower_text = (result["name"] + " " + raw_input).lower()
    
    # 1. Bottomwear waist sizes e.g. 28, 30, 32, 34, 36, 38, 40 (for Jeans, Cargo, Joggers, Pants)
    is_bottomwear = any(k in lower_text for k in ['jean', 'cargo', 'jogger', 'pant', 'trouser', 'chinos', 'bottomwear'])
    if is_bottomwear:
        waist_matches = re.findall(r'\b(2[8]|3[02468]|4[02])\b', raw_input)
        if waist_matches:
            found_sizes.extend(list(dict.fromkeys(waist_matches)))
    
    # 2. Indian shoe sizes e.g. IND-6, IND-7, IND-8, IND-9, IND-10 or UK-6, UK 7
    ind_sizes = re.findall(r'(?:IND|UK)\s*[-:]?\s*([0-9]{1,2})', raw_input, re.IGNORECASE)
    if ind_sizes:
        found_sizes.extend([f"IND-{s}" for s in dict.fromkeys(ind_sizes)])
    
    # 3. Apparel sizes
    sizes_match = re.search(r'Sizes?\s*:\s*([^\n\r]+(?:\n[^\n\r]+)*)', raw_input, re.IGNORECASE)
    if sizes_match:
        sizes_text = sizes_match.group(1)
        for s in ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']:
            if re.search(rf'\b{s}\b', sizes_text, re.IGNORECASE):
                found_sizes.append(s)

    if not found_sizes:
        for s in ['XS', 'S', 'M', 'L', 'XL', 'XXL']:
            if re.search(rf'\b{s}\b', raw_input):
                found_sizes.append(s)

    # Intelligent size selection based on category
    if found_sizes:
        result["sizes"] = list(dict.fromkeys(found_sizes))
    else:
        cat = result["category_slug"]
        if is_bottomwear:
            result["sizes"] = ["30", "32", "34", "36"]
        elif cat in ["bags-footwear", "footwear"] or any(k in lower_text for k in ['shoe', 'sneaker', 'sandal', 'slipper', 'footwear']):
            result["sizes"] = ["IND-6", "IND-7", "IND-8", "IND-9", "IND-10"]
        elif cat in ["men", "mens-fashion", "women-western", "womens-fashion", "kurti-saree-lehenga"]:
            result["sizes"] = ["S", "M", "L", "XL", "XXL"]
        elif cat in ["kids-toys", "kids-fashion"]:
            result["sizes"] = ["2-3 Yrs", "3-4 Yrs", "4-5 Yrs", "5-6 Yrs"]
        else:
            result["sizes"] = ["Free Size"]

    # Image assignment: If no image found in input, auto-assign premium category-matched photo
    if not result["images"]:
        assigned_img = None
        for keywords, img_url in KEYWORD_SPECIFIC_IMAGES:
            if any(k in lower_text for k in keywords):
                assigned_img = img_url
                break
        if not assigned_img:
            assigned_img = CATEGORY_FALLBACK_IMAGES.get(
                result["category_slug"],
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
            )
        result["images"] = [assigned_img]

    # Calculate recommended selling price and MRP
    cost = result["purchase_cost"]
    if cost > 0:
        if cost <= 250:
            suggested_sell = cost + 200
        elif cost <= 500:
            suggested_sell = cost + 250
        else:
            suggested_sell = cost * 1.55
        
        suggested_sell = round(suggested_sell / 10) * 10 - 1
        if suggested_sell <= cost:
            suggested_sell = cost + 199
        
        result["selling_price"] = float(suggested_sell)
        result["original_price"] = float(round((suggested_sell * 1.7) / 10) * 10 - 1)
        result["discount_percentage"] = round(((result["original_price"] - result["selling_price"]) / result["original_price"]) * 100)
    else:
        result["selling_price"] = 599.0
        result["original_price"] = 999.0
        result["discount_percentage"] = 40.0

    # Auto-generate description
    desc_lines = [
        f"Trendy and premium quality {result['name'].lower()}.",
        "Sourced with verified quality checks, breathable finish, and comfortable daily wear design."
    ]
    if result["specifications"]:
        desc_lines.append("\nProduct Highlights:")
        for k, v in result["specifications"].items():
            desc_lines.append(f"• {k}: {v}")
    desc_lines.append("\nFree Cash on Delivery (COD) available with doorstep delivery and 7-day easy exchange support.")
    result["description"] = "\n".join(desc_lines)

    return result
