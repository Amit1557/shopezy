import re
from urllib.parse import urlparse
from typing import Dict, Any, List

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
        
        # e.g., /men-cotton-shirt/p/6z3q9a -> slug is 'men-cotton-shirt'
        for part in path_parts:
            if part not in ['p', 's', 'catalog', 'product', 'd'] and len(part) > 3 and not re.match(r'^[a-z0-9]{5,10}$', part):
                clean_title = part.replace('-', ' ').replace('_', ' ').title()
                result["name"] = clean_title
                break

    # Extract any image URLs in text (meesho CDN, unsplash, jpg, png, webp)
    image_regex = r'https?://[^\s]+(?:\.jpg|\.jpeg|\.png|\.webp|images\.meesho\.com[^\s]+)[^\s]*'
    found_images = re.findall(image_regex, raw_input, re.IGNORECASE)
    for img in found_images:
        clean_img = img.rstrip('.,;)"\'')
        if clean_img not in result["images"]:
            result["images"].append(clean_img)

    # 2. Extract structured fields from shared Meesho text
    # e.g.: Name : Men Regular Fit Cotton Shirt
    name_match = re.search(r'(?:Name|Product\s*Name|Title)\s*:\s*([^\n\r]+)', raw_input, re.IGNORECASE)
    if name_match:
        result["name"] = name_match.group(1).strip()

    # Price / Cost
    price_match = re.search(r'(?:Price|Rs\.?|₹|Cost)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)', raw_input, re.IGNORECASE)
    if price_match:
        try:
            result["purchase_cost"] = float(price_match.group(1))
        except ValueError:
            pass

    if meesho_cost and meesho_cost > 0:
        result["purchase_cost"] = meesho_cost

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
        # Look for S, M, L, XL, XXL, Free Size, UK 6, etc.
        for s in ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']:
            if re.search(rf'\b{s}\b', sizes_text, re.IGNORECASE):
                found_sizes.append(s)
        # Check shoe sizes: UK 6, UK 7, etc.
        for uk in re.findall(r'UK\s*\d+', sizes_text, re.IGNORECASE):
            found_sizes.append(uk.upper())
    
    if not found_sizes:
        # Fallback common sizes if word S, M, L, XL in text
        for s in ['S', 'M', 'L', 'XL', 'Free Size']:
            if re.search(rf'\b{s}\b', raw_input):
                found_sizes.append(s)
    
    result["sizes"] = list(dict.fromkeys(found_sizes)) if found_sizes else ["Free Size"]

    # If title not found yet, use first line or fallback
    if not result["name"]:
        first_line = raw_input.split('\n')[0].strip()
        if first_line and not first_line.startswith('http'):
            result["name"] = first_line[:120]
        else:
            result["name"] = "Trendy Meesho Sourced Product"

    # Category heuristic detection (check women/kids before men to avoid substring clashes)
    lower_text = (result["name"] + " " + raw_input).lower()
    if any(w in lower_text for w in ['saree', 'kurti', 'anarkali', 'lehenga', 'women', 'dress', 'gown', 'dupatta', 'suit']):
        result["category_slug"] = "womens-fashion"
    elif any(w in lower_text for w in ['kid', 'baby', 'boy', 'girl', 'child', 'toddler']):
        result["category_slug"] = "kids-fashion"
    elif any(w in lower_text for w in ['shoe', 'sneaker', 'sandal', 'slipper', 'boot', 'footwear', 'crocs', 'loafers']):
        result["category_slug"] = "footwear"
    elif any(w in lower_text for w in ['shirt', 'tshirt', 't-shirt', 'men ', 'mens', "men's", 'jeans', 'trouser', 'blazer']):
        result["category_slug"] = "mens-fashion"
    elif any(w in lower_text for w in ['watch', 'belt', 'wallet', 'sunglasses', 'jewel', 'ring', 'necklace', 'handbag', 'bag']):
        result["category_slug"] = "accessories"
    elif any(w in lower_text for w in ['kitchen', 'home', 'bottle', 'chopper', 'bedsheet', 'curtain', 'pillow', 'cookware']):
        result["category_slug"] = "home-kitchen"
    elif any(w in lower_text for w in ['beauty', 'cream', 'perfume', 'makeup', 'serum', 'lotion', 'lipstick', 'skincare']):
        result["category_slug"] = "beauty-lifestyle"
    elif 'kurta' in lower_text:
        result["category_slug"] = "womens-fashion"
    elif any(w in lower_text for w in ['beauty', 'cream', 'perfume', 'makeup', 'serum', 'lotion']):
        result["category_slug"] = "beauty-lifestyle"

    # Calculate recommended selling price and MRP
    cost = result["purchase_cost"]
    if cost > 0:
        # Standard reseller pricing formula:
        # If cost <= 300: add Rs 200 - Rs 250
        # If cost > 300: add 50-70% margin
        if cost <= 250:
            suggested_sell = cost + 200
        elif cost <= 500:
            suggested_sell = cost + 300
        else:
            suggested_sell = cost * 1.55
        
        # Round to 99 ending (e.g. 499, 599, 699, 899)
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

    # Auto-generate a clean description
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
