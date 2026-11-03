import re
from urllib.parse import urlparse
from typing import Dict, Any, List

CATEGORY_FALLBACK_IMAGES = {
    "mens-fashion": "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80",
    "womens-fashion": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    "footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "kids-fashion": "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
    "accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "home-kitchen": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
    "beauty-lifestyle": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
}

KEYWORD_SPECIFIC_IMAGES = [
    (['gym', 'sport', 'jogger', 'track', 'fitness'], "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"),
    (['shoe', 'sneaker', 'running'], "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"),
    (['saree', 'silk', 'kanjivaram'], "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"),
    (['kurti', 'anarkali', 'suit'], "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"),
    (['shirt', 'cotton', 'formal'], "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"),
    (['tshirt', 't-shirt', 'round neck'], "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"),
    (['watch', 'analog', 'smartwatch'], "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"),
    (['bottle', 'chopper', 'cookware'], "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80"),
]

def parse_meesho_data(raw_input: str, meesho_cost: float = None, margin_percent: float = 60.0) -> Dict[str, Any]:
    """
    Intelligently parses Meesho product link or Meesho shared product description.
    Extracts title, suggested category, sizes, specifications, purchase cost, and recommended selling price.
    """
    raw_input = raw_input.strip()
    result = {
        "name": "",
        "category_slug": "mens-fashion",
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
        
        # Extract title from slug
        parsed_url = urlparse(url)
        path_parts = [p for p in parsed_url.path.split('/') if p]
        
        # e.g., /premium-sports-gym-trending-stylish/p/gtq4o4 -> slug is 'premium-sports-gym-trending-stylish'
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

    # Price / Cost extraction
    price_match = re.search(r'(?:Price|Rs\.?|₹|Cost|\bINR\b)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)', raw_input, re.IGNORECASE)
    if price_match:
        try:
            result["purchase_cost"] = float(price_match.group(1))
        except ValueError:
            pass
    else:
        # Fallback: check if text has standalone 3-4 digit price (e.g. 299, 349, 499) excluding years 2020-2030
        digits = re.findall(r'\b([1-9][0-9]{2,3})\b', raw_input)
        valid_digits = [float(d) for d in digits if not (2020 <= int(d) <= 2030)]
        if valid_digits:
            result["purchase_cost"] = valid_digits[0]

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

    # Category heuristic detection
    lower_text = (result["name"] + " " + raw_input).lower()
    if any(w in lower_text for w in ['saree', 'kurti', 'anarkali', 'lehenga', 'women', 'dress', 'gown', 'dupatta', 'suit']):
        result["category_slug"] = "womens-fashion"
    elif any(w in lower_text for w in ['kid', 'baby', 'boy', 'girl', 'child', 'toddler']):
        result["category_slug"] = "kids-fashion"
    elif any(w in lower_text for w in ['shoe', 'sneaker', 'sandal', 'slipper', 'boot', 'footwear', 'crocs', 'loafers']):
        result["category_slug"] = "footwear"
    elif any(w in lower_text for w in ['shirt', 'tshirt', 't-shirt', 'men ', 'mens', "men's", 'gym', 'jogger', 'jeans', 'trouser', 'blazer']):
        result["category_slug"] = "mens-fashion"
    elif any(w in lower_text for w in ['watch', 'belt', 'wallet', 'sunglasses', 'jewel', 'ring', 'necklace', 'handbag', 'bag']):
        result["category_slug"] = "accessories"
    elif any(w in lower_text for w in ['kitchen', 'home', 'bottle', 'chopper', 'bedsheet', 'curtain', 'cookware']):
        result["category_slug"] = "home-kitchen"
    elif any(w in lower_text for w in ['beauty', 'cream', 'perfume', 'makeup', 'serum', 'lotion', 'lipstick', 'skincare']):
        result["category_slug"] = "beauty-lifestyle"

    # Specifications extraction
    spec_patterns = [
        "Fabric", "Pattern", "Fit", "Sleeve Length", "Collar", "Length",
        "Neck", "Closure", "Occasion", "Material", "Color", "Type"
    ]
    for spec in spec_patterns:
        m = re.search(rf'{spec}\s*:\s*([^\n\r]+)', raw_input, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            result["specifications"][spec] = val
            if spec.lower() == "color" and val:
                result["colors"] = [c.strip() for c in val.split('/')]

    # Sizes extraction
    sizes_match = re.search(r'Sizes?\s*:\s*([^\n\r]+(?:\n[^\n\r]+)*)', raw_input, re.IGNORECASE)
    found_sizes = []
    if sizes_match:
        sizes_text = sizes_match.group(1)
        for s in ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']:
            if re.search(rf'\b{s}\b', sizes_text, re.IGNORECASE):
                found_sizes.append(s)
        for uk in re.findall(r'UK\s*\d+', sizes_text, re.IGNORECASE):
            found_sizes.append(uk.upper())

    if not found_sizes:
        for s in ['XS', 'S', 'M', 'L', 'XL', 'XXL']:
            if re.search(rf'\b{s}\b', raw_input):
                found_sizes.append(s)

    # Intelligent size selection based on category
    if found_sizes:
        result["sizes"] = list(dict.fromkeys(found_sizes))
    else:
        cat = result["category_slug"]
        if cat in ["mens-fashion", "womens-fashion"]:
            result["sizes"] = ["S", "M", "L", "XL", "XXL"]
        elif cat == "footwear":
            result["sizes"] = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"]
        elif cat == "kids-fashion":
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
                "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80"
            )
        result["images"] = [assigned_img]

    # Calculate recommended selling price and MRP
    cost = result["purchase_cost"]
    if cost > 0:
        if cost <= 250:
            suggested_sell = cost + 200
        elif cost <= 500:
            suggested_sell = cost + 280
        else:
            suggested_sell = cost * 1.55
        
        suggested_sell = round(suggested_sell / 100) * 100 - 1
        if suggested_sell <= cost:
            suggested_sell = cost + 199
        
        result["selling_price"] = float(suggested_sell)
        result["original_price"] = float(round((suggested_sell * 1.8) / 100) * 100 - 1)
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
