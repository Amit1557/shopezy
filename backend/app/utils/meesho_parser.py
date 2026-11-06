import re
from urllib.parse import urlparse
from typing import Dict, Any, List

# Strict Anti-Banner and Anti-Offer Blacklist to block promo app download ribbons (like "35% OFF on 1st order")
BANNER_BLACKLIST_REGEX = re.compile(
    r'(?:banner|offer|promo|download|app_download|app_install|campaign|strip|badge|coupon|supplier|header|footer|35%|35_off|icon|logo|avatar|rating|star|google_play|app_store|marketing|growth|pow|widgets|ribbon|first_order)',
    re.IGNORECASE
)

def is_valid_product_image(url: str) -> bool:
    """
    Validates that an image URL is a real product photo and NOT a marketing banner,
    35% OFF discount ribbon, app download ad, or generic UI icon.
    """
    if not url or not isinstance(url, str):
        return False
    u = url.strip()
    if not u.startswith("http"):
        return False
    if "meesho.com/p/" in u:
        return False
    # If the image is hosted on Meesho CDN, it MUST be a product photo in /products/
    if "images.meesho.com" in u and "/products/" not in u:
        return False
    if BANNER_BLACKLIST_REGEX.search(u):
        return False
    return True

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

    # 12. Belts & Accessories (High priority for women belts, waist belts)
    if any(k in t for k in ['belt', 'belts', 'waist belt', 'buckle belt']):
        return "jewellery-accessories"

    # 13. Mattresses & Bedding (High priority for baby mattresses vs home bedding)
    if any(k in t for k in ['mattress', 'matress', 'bedsheet', 'bed sheet', 'crib', 'protector', 'baby mat']):
        if any(k in t for k in ['baby', 'kid', 'child', 'infant', 'toddler']):
            return "kids-toys"
        return "home-kitchen"

    # 14. Men Apparel
    if re.search(r'\b(men|man|gents|male)\b', t) or any(k in t for k in ['shirt', 'tshirt', 't-shirt', 'polo', 'jeans', 'trouser', 'cargo', 'jogger', 'hoodie', 'jacket', 'blazer', 'track pant', 'chinos', 'kurta men']):
        return "men"

    if is_female:
        return "women-western"

    return "jewellery-accessories"


def extract_nlp_categories_and_tags(name: str, raw_text: str = "") -> Dict[str, Any]:
    """
    NLP Title and Keyword parser that mimics Meesho's intelligent product categorization.
    Detects composite terms (e.g., 'women' + 'belt' -> 'Women Belts' under 'jewellery-accessories').
    Returns suggested category, subcategories, tags, and inferred specifications.
    """
    text = (name + " " + raw_text).lower()
    tags = set()
    subcategories = []
    suggested_category = map_meesho_category(text)
    specs = {}

    # 1. Gender Detection
    if re.search(r'\b(women|woman|ladies|female|girl|girls)\b', text):
        specs["Gender"] = "Women"
        tags.update(["women", "women fashion", "ladies"])
    elif re.search(r'\b(men|man|gents|male|boy|boys)\b', text):
        specs["Gender"] = "Men"
        tags.update(["men", "mens fashion", "gents"])
    elif re.search(r'\b(baby|kid|kids|child|children|infant|toddler)\b', text):
        specs["Gender"] = "Kids"
        tags.update(["kids", "children", "baby"])
    else:
        specs["Gender"] = "Unisex"
        tags.add("unisex")

    # 2. Belts (e.g. Women Belt, Leather Belt, Waist Belt)
    if re.search(r'\b(belt|belts|waist belt|buckle belt)\b', text):
        if specs.get("Gender") == "Women" or "women" in text or "ladies" in text:
            suggested_category = "jewellery-accessories"
            subcategories.extend(["Women Belts", "Belts", "Waist Belts"])
            tags.update(["women belt", "leather belt", "waist belt", "belt", "belts", "accessories", "women accessories", "ladies belt"])
            specs["Type"] = "Waist Belt"
            if "leather" in text or "pu" in text or "faux" in text:
                specs["Material"] = "Faux Leather / Leatherette"
        else:
            suggested_category = "jewellery-accessories"
            subcategories.extend(["Men Belts", "Belts", "Formal Belts"])
            tags.update(["belt", "belts", "men belt", "leather belt", "formal belt", "accessories"])
            specs["Type"] = "Formal Belt"

    # 3. Mattresses & Bedding (Mattress in Home, Baby Mattress in Kids)
    elif re.search(r'\b(mattress|matress|bedsheet|bed sheet|protector|crib|baby mat|waterproof mat)\b', text):
        if re.search(r'\b(baby|kid|kids|infant|toddler|crib)\b', text):
            suggested_category = "kids-toys"
            subcategories.extend(["Kids Baby & Toddler", "Baby Mattresses", "Mattress Protectors", "Kids Bedding"])
            tags.update(["baby mattress", "kids mattress", "waterproof mattress", "mattress", "kids", "baby care", "bedsheet", "home-kitchen"])
            specs["Type"] = "Baby Waterproof Mattress"
        else:
            suggested_category = "home-kitchen"
            subcategories.extend(["Mattress Protectors", "Bedsheets", "Home Furnishing"])
            tags.update(["mattress", "bedsheet", "mattress protector", "home & kitchen", "furnishing", "bedding"])
            specs["Type"] = "Mattress Protector"

    # 4. Kids Toys & Summer Picks
    elif re.search(r'\b(toy|toys|stuffed|teddy|plush|clay|slime|tent|playhouse|pretend play|board game|educational toy|doll|puzzle|action figure)\b', text):
        suggested_category = "kids-toys"
        tags.update(["kids toys", "toys", "summer picks", "kids", "games", "baby toys"])
        if re.search(r'\b(teddy|plush|stuffed|soft toy)\b', text):
            subcategories.extend(["Soft Toys", "Kids Toys", "Summer Picks"])
            specs["Type"] = "Plush Soft Toy"
            tags.add("soft toys")
        elif re.search(r'\b(clay|slime|colour|color|crayon|neon)\b', text):
            subcategories.extend(["Clay & Slime", "Educational Toys", "Kids Toys"])
            specs["Type"] = "Creative Clay & Slime"
            tags.add("clay & slime")
        elif re.search(r'\b(tent|playhouse|play tent|kitchen set|pretend)\b', text):
            subcategories.extend(["Dress Up & Pretend Play", "Kids Toys", "Play Tents"])
            specs["Type"] = "Kids Play Tent"
            tags.add("pretend play")
        elif re.search(r'\b(puzzle|jigsaw|educational|board game|learning)\b', text):
            subcategories.extend(["Educational Toys", "Board Games", "Kids Toys"])
            specs["Type"] = "Educational Learning Toy"
            tags.add("educational toys")
        else:
            subcategories.extend(["Kids Baby & Toddler Toys", "Kids Toys", "Toy Vehicles"])
            specs["Type"] = "Kids Toy"

    # 5. Footwear (Flip Flops, Shoes, Sandals, Slippers)
    elif re.search(r'\b(flip flop|flip-flop|slipper|chappal|shoe|sneaker|sandal|loafer|crocs|footwear|slides)\b', text):
        suggested_category = "bags-footwear"
        tags.update(["footwear", "shoes", "chappal", "slippers", "flip flops", "casual wear"])
        if re.search(r'\b(flip flop|flip-flop|slipper|chappal|slide|slides)\b', text):
            subcategories.extend(["Flip Flops", "Slippers", "Sandals & Floaters"])
            specs["Type"] = "Thong Flip-flops"
            specs["Sole Material"] = "EVA"
            tags.update(["flip flops", "thong flip-flops", "eva slippers", "chappal"])
        elif re.search(r'\b(sneaker|running|sports shoe)\b', text):
            subcategories.extend(["Sports Shoes", "Sneakers", "Running Shoes"])
            specs["Type"] = "Sneakers"
            specs["Sole Material"] = "Airmax / Rubber"
            tags.update(["sneakers", "running shoes", "sports shoes"])
        else:
            subcategories.extend(["Casual Shoes", "Sandals & Floaters", "Footwear"])
            specs["Type"] = "Casual Footwear"

    # 6. Watches
    elif re.search(r'\b(watch|smartwatch|analog|digital|chronograph)\b', text):
        suggested_category = "watches"
        tags.update(["watches", "watch", "smartwatch", "accessories"])
        if "smart" in text:
            subcategories.extend(["Smartwatches", "Digital Watches"])
            specs["Type"] = "Smartwatch"
        elif "analog" in text or "leather" in text:
            subcategories.extend(["Analog Watches", "Men Watches"])
            specs["Type"] = "Analog Watch"
        else:
            subcategories.extend(["Analog Watches", "Smartwatches", "Men Watches"])
            specs["Type"] = "Wristwatch"

    # 7. Sarees, Kurtis & Indian Ethnic
    elif re.search(r'\b(saree|sari|kurti|kurta|anarkali|lehenga|dupatta|salwar|suit|sharara)\b', text):
        if re.search(r'\b(men|boy|gents)\b', text) and any(k in text for k in ['kurta', 'sherwani', 'dhoti']):
            suggested_category = "men"
            subcategories.extend(["Men Ethnic Wear", "Kurtas", "Sherwanis"])
            tags.update(["men kurta", "ethnic wear", "men"])
        else:
            suggested_category = "kurti-saree-lehenga"
            tags.update(["kurti", "saree", "ethnic wear", "women fashion", "anarkali"])
            if "saree" in text:
                subcategories.extend(["Cotton Sarees", "Silk Sarees", "Georgette Sarees"])
                specs["Type"] = "Ethnic Saree"
            elif "kurti" in text:
                subcategories.extend(["Cotton Kurtis", "Anarkali Kurtis", "Rayon Kurtis"])
                specs["Type"] = "Ethnic Kurti"
            else:
                subcategories.extend(["Lehenga Cholis", "Ethnic Sets", "Kurtis"])
                specs["Type"] = "Ethnic Wear"

    # 8. Bags & Wallets
    elif re.search(r'\b(bag|backpack|handbag|tote|purse|wallet|clutch|sling bag)\b', text):
        suggested_category = "bags-footwear"
        subcategories.extend(["Handbags", "Sling Bags", "Backpacks", "Wallets"])
        tags.update(["bags", "handbag", "sling bag", "backpack", "wallet", "accessories"])
        specs["Type"] = "Fashion Bag"

    # 9. Home & Kitchen (Clocks, Cookware, Decor, Kitchen)
    elif re.search(r'\b(clock|wall clock|curtain|bottle|cookware|pan|kadhai|container|decor|kitchen|home)\b', text):
        suggested_category = "home-kitchen"
        tags.update(["home & kitchen", "home decor", "kitchenware", "household"])
        if "clock" in text:
            subcategories.extend(["Wall Clocks", "Home Decor", "Fancy Clocks"])
            specs["Type"] = "Wall Clock"
        elif "curtain" in text:
            subcategories.extend(["Curtains", "Home Furnishing"])
            specs["Type"] = "Door & Window Curtains"
        else:
            subcategories.extend(["Kitchenware", "Storage & Containers", "Home Essentials"])
            specs["Type"] = "Kitchen Utility"

    # 10. Electronics & Audio
    elif re.search(r'\b(earphone|headphone|earbud|airpod|tws|speaker|bluetooth|charger|usb|cable|neckband)\b', text):
        suggested_category = "electronics"
        subcategories.extend(["Bluetooth Earbuds", "Wireless Headphones", "Speakers", "Mobile Accessories"])
        tags.update(["electronics", "audio", "earbuds", "tws", "gadgets"])
        specs["Type"] = "Audio Gadget"

    # 11. Western Wear (Jeans, Tops, T-shirts, Shirts, Dresses)
    elif re.search(r'\b(jean|jeans|top|tshirt|t-shirt|shirt|dress|skirt|gown|trouser|cargo|jogger|hoodie|jacket)\b', text):
        if specs.get("Gender") == "Women" or "women" in text or "ladies" in text:
            suggested_category = "women-western"
            tags.update(["women western", "western wear", "tops", "dresses", "jeans"])
            if "dress" in text or "gown" in text:
                subcategories.extend(["Western Dresses", "Gowns", "Maxi Dresses"])
                specs["Type"] = "Western Dress"
            elif "jean" in text or "cargo" in text or "pant" in text:
                subcategories.extend(["Jeans", "Cargos", "Trousers"])
                specs["Type"] = "Women Jeans"
            else:
                subcategories.extend(["Tops & Tunics", "Crop Tops", "T-shirts"])
                specs["Type"] = "Casual Top"
        else:
            suggested_category = "men"
            tags.update(["men fashion", "men clothing", "shirts", "t-shirts", "jeans"])
            if "shirt" in text:
                subcategories.extend(["Casual Shirts", "Formal Shirts"])
                specs["Type"] = "Men Shirt"
            elif "tshirt" in text or "t-shirt" in text:
                subcategories.extend(["Round Neck T-shirts", "Polo T-shirts"])
                specs["Type"] = "Men T-shirt"
            elif "jean" in text or "cargo" in text or "jogger" in text:
                subcategories.extend(["Men Jeans", "Cargos", "Joggers"])
                specs["Type"] = "Men Jeans"
            else:
                subcategories.extend(["Men Apparel", "Casual Wear"])
                specs["Type"] = "Men Wear"

    # Individual words from title as general search tags
    words = [w.strip() for w in re.split(r'[\s,\-_()]+', name.lower()) if len(w) > 2 and not w.isdigit()]
    for w in words[:12]:
        tags.add(w)

    return {
        "suggested_category": suggested_category,
        "subcategories": list(dict.fromkeys(subcategories)),
        "tags": list(dict.fromkeys(tags)),
        "specs": specs
    }


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
        "tags": [],
        "subcategories": [],
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
        # Block all promotional offer banners, app download ads, and junk icons
        if not is_valid_product_image(clean_img):
            continue
        if clean_img not in result["images"]:
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

    # Category Mapping & NLP Multi-Tag Auto Extraction
    nlp_data = extract_nlp_categories_and_tags(result["name"], explicit_category + " " + raw_input)
    result["tags"] = nlp_data["tags"]
    result["subcategories"] = nlp_data["subcategories"]
    
    if explicit_category:
        result["category_slug"] = map_meesho_category(explicit_category + " " + result["name"])
    else:
        result["category_slug"] = nlp_data["suggested_category"]

    if nlp_data["subcategories"] and "Subcategory" not in result["specifications"]:
        result["specifications"]["Subcategory"] = nlp_data["subcategories"][0]
    for k, v in nlp_data["specs"].items():
        if k not in result["specifications"]:
            result["specifications"][k] = v

    # Specifications extraction
    spec_patterns = [
        "Pattern", "Color", "Sole Material", "Type", "Fabric", "Material",
        "Fit", "Sleeve Length", "Collar", "Length", "Neck", "Closure",
        "Occasion", "Net Quantity", "Country of Origin", "Toe Shape", "Heel Type"
    ]
    for spec in spec_patterns:
        # Check colon format: Pattern : Solid
        m = re.search(rf'\b{spec}\s*:\s*([^\n\r]+)', raw_input, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            if val and len(val) < 60:
                result["specifications"][spec] = val
        else:
            # Check newline format: Pattern\nSolid
            m2 = re.search(rf'\b{spec}\s*\n\s*([^\n\r]+)', raw_input, re.IGNORECASE)
            if m2:
                val2 = m2.group(1).strip()
                if val2 and len(val2) < 60 and not any(sp.lower() == val2.lower() for sp in spec_patterns):
                    result["specifications"][spec] = val2

    # Extract color from specs if present
    color_val = result["specifications"].get("Color") or result["specifications"].get("color")
    if color_val:
        extracted = [c.strip().title() for c in re.split(r'[/,]+', color_val) if c.strip()]
        for c in extracted:
            if c not in result["colors"]:
                result["colors"].append(c)

    # Extract color from product title (e.g. (Black), Black, Navy Blue, etc.)
    title_colors = re.findall(r'\b(Black|Blue|Navy|White|Red|Green|Grey|Gray|Yellow|Pink|Maroon|Brown|Beige|Orange|Purple|Olive)\b', result["name"] + " " + raw_input, re.IGNORECASE)
    for tc in title_colors:
        tc_title = tc.capitalize()
        if tc_title not in result["colors"]:
            result["colors"].append(tc_title)

    lower_text = (result["name"] + " " + raw_input).lower()

    # Auto-fill missing intelligent specifications based on Category & Title
    cat_slug = result["category_slug"]
    specs = result["specifications"]
    detected_color = result["colors"][0] if result["colors"] else "Black"
    if "Color" not in specs:
        specs["Color"] = detected_color

    if "Pattern" not in specs:
        specs["Pattern"] = "Solid"

    # Category specific highlights
    if cat_slug in ["bags-footwear", "footwear"] or any(k in lower_text for k in ['flip flop', 'slipper', 'sandal', 'shoe', 'sneaker', 'crocs', 'loafer']):
        if "Sole Material" not in specs:
            specs["Sole Material"] = "EVA" if any(k in lower_text for k in ['flip flop', 'slipper', 'slide']) else "Airmax / Rubber"
        if "Type" not in specs:
            if 'flip flop' in lower_text or 'slipper' in lower_text:
                specs["Type"] = "Thong Flip-flops"
            elif 'sandal' in lower_text:
                specs["Type"] = "Casual Sandals"
            else:
                specs["Type"] = "Comfort Footwear"
        if "Occasion" not in specs:
            specs["Occasion"] = "Daily & Casual Wear"
        if "Net Quantity" not in specs:
            specs["Net Quantity"] = "1 Pair"
    elif cat_slug in ["kurti-saree-lehenga", "women-western"] or any(k in lower_text for k in ['saree', 'kurti', 'dress', 'top']):
        if "Fabric" not in specs:
            specs["Fabric"] = "Pure Cotton Blend" if 'cotton' in lower_text else "Georgette / Silk Blend"
        if "Type" not in specs:
            specs["Type"] = "Ethnic Wear" if 'kurti' in lower_text or 'saree' in lower_text else "Western Casual Wear"
        if "Occasion" not in specs:
            specs["Occasion"] = "Festive & Daily Wear"
        if "Net Quantity" not in specs:
            specs["Net Quantity"] = "1 N"
    elif cat_slug in ["men", "mens-fashion"] or any(k in lower_text for k in ['shirt', 't-shirt', 'tshirt', 'jeans', 'pant', 'cargo']):
        if "Fabric" not in specs:
            specs["Fabric"] = "100% Breathable Cotton" if 'tshirt' in lower_text or 't-shirt' in lower_text or 'shirt' in lower_text else "Comfort Denim Blend"
        if "Fit" not in specs:
            specs["Fit"] = "Regular Comfort Fit"
        if "Occasion" not in specs:
            specs["Occasion"] = "Casual / Daily Wear"
        if "Net Quantity" not in specs:
            specs["Net Quantity"] = "1 N"
    else:
        if "Material" not in specs:
            specs["Material"] = "High Grade Verified Quality"
        if "Occasion" not in specs:
            specs["Occasion"] = "Daily Use"
        if "Net Quantity" not in specs:
            specs["Net Quantity"] = "1 N"

    if "Country of Origin" not in specs:
        specs["Country of Origin"] = "India"

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
