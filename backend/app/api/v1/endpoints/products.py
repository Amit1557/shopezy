from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_, and_, func, String
from typing import List, Optional, Dict, Any
import os, uuid, re
from ....database.database import get_db
from ....models.product import Product, ProductImage, ProductVariant, ProductReview
from ....models.admin import Admin
from ....schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductPublic,
    ProductAdmin,
    ProductVariantCreate,
    ProductPublicDetail,
    ProductReviewCreate,
    ProductReviewOut,
)
from .deps import get_current_admin
from ....core.config import settings
from ....utils.meesho_parser import parse_meesho_data, extract_nlp_categories_and_tags, is_valid_product_image

router = APIRouter()

CATEGORY_CROSS_KEYWORDS = {
    "kids-toys": ["kid", "baby", "toy", "toddler", "infant", "stuffed", "teddy", "plush", "clay", "slime", "tent", "frock", "board game", "doll", "puzzle", "mattress protector", "baby mat", "summer picks", "playhouse"],
    "kids-fashion": ["kid", "baby", "boys", "girls", "frock", "romper", "tshirt", "dress", "shorts", "wear"],
    "home-kitchen": ["kitchen", "home", "cookware", "pan", "bottle", "bedsheet", "curtain", "mattress", "clock", "pillow", "blanket", "towel", "container", "decor", "furnishing"],
    "jewellery-accessories": ["jewel", "necklace", "earring", "bangle", "ring", "belt", "sunglass", "bracelet", "watch", "accessories", "chain", "pendant"],
    "accessories": ["belt", "belts", "sunglass", "watch", "wallet", "bag", "jewel", "cap", "hat", "muffler", "accessories"],
    "bags-footwear": ["bag", "handbag", "backpack", "sling", "wallet", "shoe", "sneaker", "sandal", "slipper", "chappal", "flip flop", "footwear", "crocs", "loafer", "heel", "clutch"],
    "footwear": ["shoe", "sneaker", "sandal", "slipper", "chappal", "flip flop", "footwear", "crocs", "loafer", "heel", "slide"],
    "kurti-saree-lehenga": ["saree", "sari", "kurti", "kurta", "anarkali", "lehenga", "dupatta", "salwar", "suit", "sharara", "ethnic"],
    "women-western": ["dress", "western", "top", "tunic", "jumpsuit", "gown", "skirt", "crop top", "jean", "jeans", "trouser", "cargo", "hoodie", "jacket", "belt", "palazzo"],
    "womens-fashion": ["women", "dress", "saree", "kurti", "top", "gown", "jeans", "skirt", "belt", "handbag", "ladies"],
    "men": ["men", "shirt", "tshirt", "t-shirt", "polo", "jeans", "trouser", "cargo", "jogger", "hoodie", "jacket", "chinos", "kurta men", "belt"],
    "mens-fashion": ["men", "shirt", "tshirt", "polo", "jeans", "trouser", "shoes", "sneakers", "watch", "belt"],
    "watches": ["watch", "smartwatch", "analog", "digital", "chronograph", "wrist watch", "clock", "wall clock", "clocks", "ghadi"],
    "electronics": ["earphone", "headphone", "earbud", "speaker", "bluetooth", "charger", "tws", "cable", "gadget", "electronics"],
    "beauty-health": ["beauty", "cream", "perfume", "makeup", "serum", "lipstick", "skincare", "hair oil", "shampoo", "facewash"],
    "sports-fitness": ["gym", "fitness", "dumbbell", "yoga", "running", "sports", "sneaker", "track pant"]
}

SYNONYMS_MAP = {
    "watch": ["watch", "smartwatch", "analog", "clock", "wall clock", "ghadi", "watches", "clocks"],
    "watches": ["watch", "smartwatch", "analog", "clock", "wall clock", "ghadi", "watches", "clocks"],
    "clock": ["clock", "wall clock", "watch", "smartwatch", "ghadi", "clocks", "watches"],
    "clocks": ["clock", "wall clock", "watch", "smartwatch", "ghadi", "clocks", "watches"],
    "ghadi": ["watch", "smartwatch", "clock", "wall clock", "ghadi", "watches", "clocks"],
    "wallclock": ["clock", "wall clock", "watch", "ghadi"],
    "chappal": ["flip flop", "slipper", "sandal", "chappal", "slide"],
    "chappals": ["flip flop", "slipper", "sandal", "chappal", "slides"],
    "sleeper": ["slipper", "flip flop", "chappal"],
    "sleepers": ["slipper", "flip flop", "chappal"],
    "slippers": ["slipper", "flip flop", "chappal"],
    "flipflop": ["flip flop", "slipper", "chappal"],
    "flipflops": ["flip flop", "slipper", "chappal"],
    "joota": ["shoe", "sneaker", "footwear"],
    "joote": ["shoes", "sneakers", "footwear"],
    "shoes": ["shoe", "sneaker", "footwear"],
    "shoe": ["shoe", "sneaker", "footwear"],
    "belt": ["belt", "waist belt"],
    "belts": ["belt", "waist belt"],
    "toy": ["toy", "toys", "plush", "teddy", "game"],
    "toys": ["toy", "toys", "plush", "teddy", "game"],
    "kapde": ["cloth", "shirt", "tshirt", "dress", "kurti"],
    "suit": ["kurti", "salwar", "ethnic", "suit"],
    "bedsheet": ["bedsheet", "bed sheet", "fitted sheet", "chaddar", "linen"],
    "bedsheets": ["bedsheet", "bed sheet", "fitted sheet", "chaddar", "linen"],
    "earphone": ["earphone", "headphone", "earbud", "airpod", "tws", "audio"],
    "earphones": ["earphone", "headphone", "earbud", "airpod", "tws", "audio"],
}


def make_slug(name: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    slug = base
    i = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base}-{i}"
        i += 1
    return slug


def sanitize_product_category(name: str, category_id: Optional[int], db: Session) -> int:
    """
    Permanent Server-Side Taxonomy Guardrail.
    Guarantees products are never saved into conflicting categories regardless of client payload.
    """
    from ....models.category import Category
    categories = db.query(Category).all()
    if not categories:
        return category_id or 1

    cat_by_id = {c.id: c for c in categories}
    cat_by_slug = {c.slug: c for c in categories}

    current_cat = cat_by_id.get(category_id) if category_id else None
    t = (name or "").lower()

    # If category is invalid or missing, try intelligent classification
    if not current_cat:
        nlp_res = extract_nlp_categories_and_tags(name, "")
        s_slug = nlp_res.get("suggested_category")
        if s_slug and s_slug in cat_by_slug:
            return cat_by_slug[s_slug].id
        hk = cat_by_slug.get("home-kitchen")
        return hk.id if hk else categories[0].id

    # Guardrail 1: Non-electronics trapped in Electronics
    if current_cat.slug == "electronics":
        if re.search(r'\b(bedsheet|bed sheet|fitted sheet|pillow|cushion|curtain|blanket|quilt|mattress|towel|mop|cloth|microfiber|microfibre|cleaning cloth|cookware|pan|kadhai|bottle|clock|wall clock|sofa cover|chair cover|bangle stand|shoe rack|organizer|artificial plant|planter|kitchen|chopper)\b', t):
            hk = cat_by_slug.get("home-kitchen")
            if hk: return hk.id
        if re.search(r'\b(scarf|scarves|stole|stoles|necklace|earring|bangle|ring|bracelet|chain|anklet|jewel|jewellery|sunglass|goggles|hair clip|scrunchie)\b', t):
            ja = cat_by_slug.get("jewellery-accessories")
            if ja: return ja.id
        if re.search(r'\b(shoe|shoes|sneaker|sneakers|sandal|sandals|slipper|slippers|chappal|chappals|loafer|heel|boots|footwear)\b', t):
            bf = cat_by_slug.get("bags-footwear")
            if bf: return bf.id
        if re.search(r'\b(saree|sari|kurti|kurta|anarkali|lehenga|salwar|suit|sharara)\b', t):
            ks = cat_by_slug.get("kurti-saree-lehenga")
            if ks: return ks.id
        if re.search(r'\b(dress|gown|skirt|top|tunic|crop top|jeans|jumpsuit)\b', t):
            ww = cat_by_slug.get("women-western")
            if ww: return ww.id

    # Guardrail 2: Electronic audio/gadgets trapped in Fashion or Home
    if current_cat.slug in ["kurti-saree-lehenga", "women-western", "men", "home-kitchen", "lingerie", "beauty-health"]:
        if re.search(r'\b(speaker|speakers|earphone|earphones|headphone|headphones|earbud|earbuds|airpod|airpods|tws|bluetooth|charger|power bank|soundbar|aux cable|mouse|keyboard|smart watch|smartwatch|portronics|ubon)\b', t) or (re.search(r'\b(mic|microphone)\b', t) and not re.search(r'\bmicrofib', t)):
            el = cat_by_slug.get("electronics")
            if el: return el.id

    # Guardrail 3: Scarves, Stoles, Jewellery trapped in Ethnic wear
    if current_cat.slug == "kurti-saree-lehenga":
        if re.search(r'\b(scarf|scarves|stole|stoles|necklace|earring|earrings|ring|bracelet|bangle|anklet|jewel|jewellery)\b', t) and not re.search(r'\b(saree|sari|kurti|lehenga|salwar|suit|sharara)\b', t):
            ja = cat_by_slug.get("jewellery-accessories")
            if ja: return ja.id

    # Guardrail 4: Watches trapped in other departments
    if current_cat.slug != "watches":
        if re.search(r'\b(analog watch|digital watch|wrist watch|chronograph)\b', t):
            wa = cat_by_slug.get("watches")
            if wa: return wa.id

    return category_id



# PUBLIC endpoints
@router.get("/public", response_model=dict)
def get_public_products(
    page: int = 1,
    limit: int = 20,
    category_id: Optional[int] = None,
    category_slug: Optional[str] = None,
    subcategory: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    min_discount: Optional[float] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    gender: Optional[str] = None,
    sort: Optional[str] = "newest",
    featured: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    base_q = db.query(Product).filter(Product.is_active == True)

    # 1. Flexible Category Filtering with Cross-Category Discovery
    if category_id or (category_slug and category_slug != 'popular'):
        from ....models.category import Category
        cat = None
        if category_id:
            cat = db.query(Category).filter(Category.id == category_id).first()
        elif category_slug:
            cat = db.query(Category).filter(Category.slug == category_slug).first()
        
        slug_to_use = cat.slug if cat else (category_slug or "")
        
        cat_conditions = []
        if cat:
            cat_conditions.append(Product.category_id == cat.id)
            
        kws = CATEGORY_CROSS_KEYWORDS.get(slug_to_use, [])
        for kw in kws:
            cat_conditions.append(Product.name.ilike(f"%{kw}%"))
            cat_conditions.append(Product.description.ilike(f"%{kw}%"))
            cat_conditions.append(func.cast(Product.specifications, String).ilike(f"%{kw}%"))
            cat_conditions.append(func.cast(Product.tags, String).ilike(f"%{kw}%"))
            
        if cat_conditions:
            base_q = base_q.filter(or_(*cat_conditions))

    # 2. Meesho-Style Dynamic Subcategory Filtering (Phrase & Word-level Matching)
    if subcategory:
        sub_raw = subcategory.strip().lower()
        sub_conditions = [
            Product.name.ilike(f"%{sub_raw}%"),
            func.cast(Product.specifications, String).ilike(f"%{sub_raw}%"),
            func.cast(Product.tags, String).ilike(f"%{sub_raw}%")
        ]
        
        # Word-level matching (e.g. "Women Belts" -> all words "women" & "belt" match in product)
        clean_words = [w.rstrip('s') for w in re.split(r'[\s&/,]+', sub_raw) if len(w) > 2]
        if clean_words:
            word_ands = []
            for w in clean_words:
                word_ands.append(or_(
                    Product.name.ilike(f"%{w}%"),
                    Product.description.ilike(f"%{w}%"),
                    func.cast(Product.specifications, String).ilike(f"%{w}%"),
                    func.cast(Product.tags, String).ilike(f"%{w}%")
                ))
            sub_conditions.append(and_(*word_ands))
            
        base_q = base_q.filter(or_(*sub_conditions))

    # 3. Universal Smart Search (Synonyms + Multi-field Match)
    if search:
        search_clean = search.strip().lower()
        search_tokens = [w for w in re.split(r'[\s+,]+', search_clean) if len(w) > 1]
        
        for token in search_tokens:
            variants = [token]
            if token in SYNONYMS_MAP:
                variants.extend(SYNONYMS_MAP[token])
            
            token_conditions = []
            for v in variants:
                token_conditions.append(Product.name.ilike(f"%{v}%"))
                token_conditions.append(Product.description.ilike(f"%{v}%"))
                token_conditions.append(func.cast(Product.specifications, String).ilike(f"%{v}%"))
                token_conditions.append(func.cast(Product.tags, String).ilike(f"%{v}%"))
                token_conditions.append(
                    Product.variants.any(ProductVariant.value.ilike(f"%{v}%"))
                )
            base_q = base_q.filter(or_(*token_conditions))

    # 4. Standard Price, Rating, Discount & Attributes Filter
    if min_price is not None:
        base_q = base_q.filter(Product.selling_price >= min_price)
    if max_price is not None:
        base_q = base_q.filter(Product.selling_price <= max_price)
    if min_rating is not None:
        base_q = base_q.filter(Product.average_rating >= min_rating)
    if min_discount is not None:
        base_q = base_q.filter(Product.discount_percentage >= min_discount)
    if size:
        base_q = base_q.filter(
            Product.variants.any(
                and_(ProductVariant.variant_type == "size", ProductVariant.value == size)
            )
        )
    if color:
        base_q = base_q.filter(
            or_(
                Product.name.ilike(f"%{color}%"),
                func.cast(Product.specifications, String).ilike(f"%{color}%"),
                func.cast(Product.tags, String).ilike(f"%{color}%"),
                Product.variants.any(
                    and_(ProductVariant.variant_type == "color", ProductVariant.value.ilike(f"%{color}%"))
                ),
            )
        )
    if gender:
        g_clean = gender.strip().lower()
        g_synonyms = [g_clean]
        if g_clean in ['girl', 'girls']:
            g_synonyms.extend(['girl', 'girls', 'female', 'women', 'daughter'])
        elif g_clean in ['boy', 'boys']:
            g_synonyms.extend(['boy', 'boys', 'male', 'men', 'son'])
        elif g_clean in ['women', 'woman', 'ladies']:
            g_synonyms.extend(['women', 'woman', 'ladies', 'female', 'girl'])
        elif g_clean in ['men', 'man', 'gents']:
            g_synonyms.extend(['men', 'man', 'gents', 'male', 'boy'])
        elif g_clean in ['kids', 'kid']:
            g_synonyms.extend(['kid', 'kids', 'baby', 'child', 'children', 'toddler', 'infant'])
            
        g_conds = []
        for g_syn in g_synonyms:
            g_conds.append(Product.name.ilike(f"%{g_syn}%"))
            g_conds.append(Product.description.ilike(f"%{g_syn}%"))
            g_conds.append(func.cast(Product.specifications, String).ilike(f"%{g_syn}%"))
            g_conds.append(func.cast(Product.tags, String).ilike(f"%{g_syn}%"))
        base_q = base_q.filter(or_(*g_conds))
    if featured is not None:
        base_q = base_q.filter(Product.is_featured == featured)

    if sort == "price_asc":
        ordered_q = base_q.order_by(Product.selling_price.asc())
    elif sort == "price_desc":
        ordered_q = base_q.order_by(Product.selling_price.desc())
    elif sort == "popular":
        ordered_q = base_q.order_by(Product.total_orders.desc())
    else:
        ordered_q = base_q.order_by(Product.created_at.desc())

    total = base_q.count()
    products = (
        ordered_q.options(selectinload(Product.images), selectinload(Product.variants))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "products": [ProductPublic.from_orm(p) for p in products],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/public/{slug}", response_model=ProductPublicDetail)
def get_public_product(slug: str, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            selectinload(Product.reviews)
        )
        .filter(Product.slug == slug, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.post("/public/{product_id}/reviews", response_model=ProductReviewOut)
def create_product_review(
    product_id: int,
    data: ProductReviewCreate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    
    clean_name = data.customer_name.strip() or "Verified Customer"
    clean_comment = data.comment.strip()
    if not clean_comment:
        raise HTTPException(400, "Review comment cannot be empty")
    
    rating = max(1, min(5, data.rating))
    review = ProductReview(
        product_id=product.id,
        customer_name=clean_name,
        rating=rating,
        title=data.title.strip() if data.title else None,
        comment=clean_comment,
        is_verified_buyer=True
    )
    db.add(review)
    db.flush()
    
    # Recalculate product average rating
    avg = db.query(func.avg(ProductReview.rating)).filter(ProductReview.product_id == product.id).scalar()
    if avg is not None:
        product.average_rating = round(float(avg), 1)
    
    db.commit()
    db.refresh(review)
    return review


# ADMIN endpoints
@router.get("/admin", response_model=dict)
def get_admin_products(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    base_q = db.query(Product)
    if search:
        base_q = base_q.filter(Product.name.ilike(f"%{search}%"))
    if category_id:
        base_q = base_q.filter(Product.category_id == category_id)
    if is_active is not None:
        base_q = base_q.filter(Product.is_active == is_active)

    total = base_q.count()
    products = (
        base_q.options(selectinload(Product.images), selectinload(Product.variants))
        .order_by(Product.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "products": [ProductAdmin.from_orm(p) for p in products],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.post("/admin", response_model=ProductAdmin)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    slug = make_slug(data.name, db)
    tags_to_save = data.tags or []
    if not tags_to_save:
        nlp_res = extract_nlp_categories_and_tags(data.name, data.description or "")
        tags_to_save = nlp_res["tags"]

    category_id = sanitize_product_category(data.name, data.category_id, db)

    product = Product(
        name=data.name,
        slug=slug,
        description=data.description,
        specifications=data.specifications,
        tags=tags_to_save,
        category_id=category_id,
        purchase_cost=data.purchase_cost,
        selling_price=data.selling_price,
        original_price=data.original_price,
        discount_percentage=data.discount_percentage,
        meesho_link=data.meesho_link,
        is_active=data.is_active,
        is_featured=data.is_featured,
        cod_available=data.cod_available,
        stock_quantity=data.stock_quantity,
    )
    db.add(product)
    db.flush()
    if data.variants:
        for v in data.variants:
            variant = ProductVariant(
                product_id=product.id,
                variant_type=v.variant_type,
                value=v.value,
                is_available=v.is_available,
            )
            db.add(variant)
    db.commit()
    db.refresh(product)
    return product


@router.get("/admin/{product_id}", response_model=ProductAdmin)
def get_admin_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    product = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.variants))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.put("/admin/{product_id}", response_model=ProductAdmin)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")

    update_dict = data.dict(exclude_none=True)
    images_list = update_dict.pop("images", None)
    sizes_list = update_dict.pop("sizes", None)

    for k, v in update_dict.items():
        setattr(product, k, v)

    # Permanent Server-Side Taxonomy Guardrail
    product.category_id = sanitize_product_category(product.name, product.category_id, db)

    # Update product images if provided
    if images_list is not None:
        db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
        for idx, img_url in enumerate(images_list):
            if img_url and isinstance(img_url, str):
                db.add(ProductImage(
                    product_id=product_id,
                    image_url=img_url,
                    is_primary=(idx == 0),
                    sort_order=idx
                ))

    # Update product size variants if provided
    if sizes_list is not None:
        db.query(ProductVariant).filter(
            ProductVariant.product_id == product_id,
            ProductVariant.variant_type == "size"
        ).delete()
        for sz in sizes_list:
            if sz and isinstance(sz, str):
                db.add(ProductVariant(
                    product_id=product_id,
                    variant_type="size",
                    value=sz.strip(),
                    is_available=True
                ))

    # Update product color variants if provided
    colors_list = getattr(data, "colors", None)
    if colors_list is not None:
        db.query(ProductVariant).filter(
            ProductVariant.product_id == product_id,
            ProductVariant.variant_type == "color"
        ).delete()
        for clr in colors_list:
            if clr and isinstance(clr, str):
                db.add(ProductVariant(
                    product_id=product_id,
                    variant_type="color",
                    value=clr.strip().capitalize(),
                    is_available=True
                ))

    db.commit()
    db.refresh(product)
    return product


@router.delete("/admin/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}


@router.post("/admin/{product_id}/variants")
def add_variants(
    product_id: int,
    variants: List[ProductVariantCreate],
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    # Clear existing variants
    db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()
    for v in variants:
        variant = ProductVariant(
            product_id=product_id,
            variant_type=v.variant_type,
            value=v.value,
            is_available=v.is_available,
        )
        db.add(variant)
    db.commit()
    return {"message": "Variants updated"}


@router.post("/admin/{product_id}/images")
def add_product_image(
    product_id: int,
    image_url: str,
    is_primary: bool = False,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    if is_primary:
        db.query(ProductImage).filter(ProductImage.product_id == product_id).update(
            {"is_primary": False}
        )
    img = ProductImage(product_id=product_id, image_url=image_url, is_primary=is_primary)
    db.add(img)
    db.commit()
    return {"message": "Image added"}


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin)
):
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(400, "Only image files (.jpg, .jpeg, .png, .webp) are allowed")
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    return {"image_url": f"http://127.0.0.1:8000/uploads/{unique_name}"}


from pydantic import BaseModel
from ....utils.meesho_parser import parse_meesho_data
from ....models.category import Category

CATEGORY_FALLBACK_IMAGES = {
    "mens-fashion": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop",
    "womens-fashion": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop",
    "kids-fashion": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&auto=format&fit=crop",
    "footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop",
    "accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop",
    "home-kitchen": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
    "beauty-lifestyle": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop",
}

class QuickPublishRequest(BaseModel):
    name: str
    selling_price: float
    purchase_cost: float = 0.0
    original_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    category_id: Optional[int] = None
    category_slug: Optional[str] = None
    description: Optional[str] = None
    meesho_link: Optional[str] = None
    images: List[str] = []
    sizes: List[str] = []
    colors: List[str] = []
    tags: Optional[List[str]] = []
    specifications: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_featured: bool = False
    cod_available: bool = True
    stock_quantity: int = 100

@router.post("/quick-publish", response_model=ProductAdmin)
def quick_publish_product(
    data: QuickPublishRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    1-Click Instant Importer & Publisher.
    Creates product, images, and variants atomically and publishes directly to customer store.
    """
    # 1. Resolve category
    category_id = data.category_id
    cat = None
    if not category_id and data.category_slug:
        cat = db.query(Category).filter(Category.slug == data.category_slug).first()
        if cat:
            category_id = cat.id
    if not category_id:
        nlp_check = extract_nlp_categories_and_tags(data.name, data.description or "")
        cat = db.query(Category).filter(Category.slug == nlp_check["suggested_category"]).first()
        if cat:
            category_id = cat.id
        else:
            first_cat = db.query(Category).filter(Category.is_active == True).first()
            if first_cat:
                category_id = first_cat.id
                cat = first_cat
    else:
        cat = db.query(Category).filter(Category.id == category_id).first()

    # 2. Compute prices
    selling_price = float(data.selling_price)
    purchase_cost = float(data.purchase_cost or 0.0)
    original_price = float(data.original_price or round((selling_price * 1.6) / 100) * 100 - 1)
    if original_price <= selling_price:
        original_price = selling_price + 199.0
    
    discount_pct = data.discount_percentage
    if discount_pct is None or discount_pct <= 0:
        discount_pct = round(((original_price - selling_price) / original_price) * 100)

    slug = make_slug(data.name, db)

    # 3. Create Product & Specs & Tags
    product_specs = data.specifications or {}
    tags_to_save = data.tags or []
    if not product_specs or not tags_to_save:
        parsed_helper = parse_meesho_data(data.name, data.purchase_cost)
        if not product_specs:
            product_specs = parsed_helper.get("specifications", {})
        if not tags_to_save:
            tags_to_save = parsed_helper.get("tags", [])

    # Permanent Server-Side Taxonomy Guardrail
    category_id = sanitize_product_category(data.name, category_id, db)

    # Permanent Deduplication Guard: Check if product already exists
    existing_product = None
    if data.meesho_link and data.meesho_link.strip():
        existing_product = db.query(Product).filter(Product.meesho_link == data.meesho_link.strip()).first()
    if not existing_product and data.name and data.name.strip():
        existing_product = db.query(Product).filter(func.lower(Product.name) == data.name.strip().lower()).first()

    if existing_product:
        existing_product.selling_price = selling_price
        existing_product.purchase_cost = purchase_cost
        existing_product.original_price = original_price
        existing_product.discount_percentage = discount_pct
        existing_product.category_id = category_id
        if tags_to_save:
            existing_product.tags = tags_to_save
        db.commit()
        db.refresh(existing_product)
        return existing_product

    product = Product(
        name=data.name,
        slug=slug,
        description=data.description or f"Trendy and premium quality {data.name}. Sourced with verified quality checks, comfortable wear and doorstep COD delivery.",
        specifications=product_specs,
        tags=tags_to_save,
        category_id=category_id,
        purchase_cost=purchase_cost,
        selling_price=selling_price,
        original_price=original_price,
        discount_percentage=discount_pct,
        meesho_link=data.meesho_link or "",
        is_active=data.is_active,
        is_featured=data.is_featured,
        cod_available=data.cod_available,
        stock_quantity=data.stock_quantity,
    )
    db.add(product)
    db.flush()

    # 4. Attach Images (Clean real photos only - reject promo banners, 35% off ads, ribbons)
    img_urls = [u.strip() for u in data.images if is_valid_product_image(u)]
    if not img_urls:
        cat_slug = cat.slug if cat else "mens-fashion"
        fallback_img = CATEGORY_FALLBACK_IMAGES.get(cat_slug, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop")
        img_urls = [fallback_img]

    for idx, url in enumerate(img_urls):
        img = ProductImage(
            product_id=product.id,
            image_url=url,
            is_primary=(idx == 0),
            sort_order=idx
        )
        db.add(img)

    # 5. Attach Variants (Sizes & Colors)
    sizes = data.sizes if data.sizes else ["Free Size"]
    for s in sizes:
        if s.strip():
            db.add(ProductVariant(
                product_id=product.id,
                variant_type="size",
                value=s.strip(),
                is_available=True
            ))

    for c in data.colors:
        if c.strip():
            db.add(ProductVariant(
                product_id=product.id,
                variant_type="color",
                value=c.strip(),
                is_available=True
            ))

    db.commit()
    db.refresh(product)
    return product

class MeeshoImportRequest(BaseModel):
    raw_text: str
    meesho_cost: Optional[float] = None
    margin_percent: Optional[float] = 60.0

@router.post("/parse-meesho")
def parse_meesho_product(
    data: MeeshoImportRequest,
    admin: Admin = Depends(get_current_admin)
):
    try:
        parsed = parse_meesho_data(data.raw_text, data.meesho_cost, data.margin_percent or 60.0)
        return parsed
    except Exception as e:
        raise HTTPException(400, f"Failed to parse Meesho input: {str(e)}")


@router.delete("/admin/{product_id}/images/{image_id}")
def delete_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    img = (
        db.query(ProductImage)
        .filter(ProductImage.id == image_id, ProductImage.product_id == product_id)
        .first()
    )
    if not img:
        raise HTTPException(404, "Image not found")
    db.delete(img)
    db.commit()
    return {"message": "Image deleted"}


class BulkPublishRequest(BaseModel):
    products: List[QuickPublishRequest]


@router.post("/bulk-publish")
def bulk_publish_products(
    data: BulkPublishRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    Atomic 1-Click Bulk Product Publisher.
    Publishes multiple products, images, and variants simultaneously.
    """
    if not data.products:
        raise HTTPException(400, "No products provided for bulk publishing")
    
    created_list = []
    categories = db.query(Category).all()
    cat_by_slug = {c.slug: c for c in categories}
    cat_by_id = {c.id: c for c in categories}
    default_cat = categories[0] if categories else None

    for item in data.products:
        if not item.name or not item.name.strip():
            continue
        
        # Category resolution
        cat = None
        if item.category_id and item.category_id in cat_by_id:
            cat = cat_by_id[item.category_id]
        elif item.category_slug and item.category_slug in cat_by_slug:
            cat = cat_by_slug[item.category_slug]
        else:
            cat = default_cat
        
        # NLP Auto-correct: If title is explicitly an electronics/watch/gadget but got misassigned to kurti/saree
        nlp_res = extract_nlp_categories_and_tags(item.name.strip(), item.description or "")
        nlp_cat_slug = nlp_res.get("suggested_category")
        if nlp_cat_slug and nlp_cat_slug in cat_by_slug:
            if not cat or (cat.slug in ['kurti-saree-lehenga', 'women-western'] and nlp_cat_slug in ['electronics', 'watches', 'home-kitchen', 'bags-footwear', 'kids-toys', 'men']):
                cat = cat_by_slug[nlp_cat_slug]

        category_id = cat.id if cat else 1

        selling_price = float(item.selling_price)
        purchase_cost = float(item.purchase_cost or 0.0)
        original_price = float(item.original_price or round((selling_price * 1.6) / 100) * 100 - 1)
        if original_price <= selling_price:
            original_price = selling_price + 199.0
        
        discount_pct = item.discount_percentage
        if discount_pct is None or discount_pct <= 0:
            discount_pct = round(((original_price - selling_price) / original_price) * 100)

        slug = make_slug(item.name.strip(), db)
        tags_to_save = getattr(item, 'tags', None) or []
        if not tags_to_save:
            nlp_res = extract_nlp_categories_and_tags(item.name.strip(), item.description or "")
            tags_to_save = nlp_res["tags"]

        # Permanent Server-Side Taxonomy Guardrail
        category_id = sanitize_product_category(item.name.strip(), category_id, db)

        # Permanent Deduplication Guard: Check if product already exists
        existing_product = None
        if item.meesho_link and item.meesho_link.strip():
            existing_product = db.query(Product).filter(Product.meesho_link == item.meesho_link.strip()).first()
        if not existing_product and item.name and item.name.strip():
            existing_product = db.query(Product).filter(func.lower(Product.name) == item.name.strip().lower()).first()

        if existing_product:
            existing_product.selling_price = selling_price
            existing_product.purchase_cost = purchase_cost
            existing_product.original_price = original_price
            existing_product.discount_percentage = discount_pct
            existing_product.category_id = category_id
            if tags_to_save:
                existing_product.tags = tags_to_save
            created_list.append(existing_product)
            continue

        product = Product(
            name=item.name.strip(),
            slug=slug,
            description=item.description or f"Premium quality {item.name.strip()}. Verified quality check with doorstep Cash on Delivery.",
            specifications=item.specifications or {},
            tags=tags_to_save,
            category_id=category_id,
            purchase_cost=purchase_cost,
            selling_price=selling_price,
            original_price=original_price,
            discount_percentage=discount_pct,
            meesho_link=item.meesho_link or "",
            is_active=item.is_active,
            is_featured=item.is_featured,
            cod_available=item.cod_available,
            stock_quantity=item.stock_quantity,
        )
        db.add(product)
        db.flush()

        img_urls = [u.strip() for u in item.images if is_valid_product_image(u)]
        if not img_urls:
            cat_slug = cat.slug if cat else "mens-fashion"
            fallback_img = CATEGORY_FALLBACK_IMAGES.get(cat_slug, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop")
            img_urls = [fallback_img]

        for idx, url in enumerate(img_urls):
            db.add(ProductImage(
                product_id=product.id,
                image_url=url,
                is_primary=(idx == 0),
                sort_order=idx
            ))

        sizes = item.sizes if item.sizes else ["Free Size"]
        for s in sizes:
            if s.strip():
                db.add(ProductVariant(
                    product_id=product.id,
                    variant_type="size",
                    value=s.strip(),
                    is_available=True
                ))

        for c in item.colors:
            if c.strip():
                db.add(ProductVariant(
                    product_id=product.id,
                    variant_type="color",
                    value=c.strip(),
                    is_available=True
                ))

        created_list.append(product)

    db.commit()
    for p in created_list:
        db.refresh(p)

    return {
        "success": True,
        "count": len(created_list),
        "message": f"Successfully published {len(created_list)} products in bulk to your live store!",
        "products": [ProductAdmin.from_orm(p) for p in created_list]
    }


class BulkParseRequest(BaseModel):
    raw_text: str
    default_markup: Optional[float] = 250.0


@router.post("/bulk-parse-meesho")
def bulk_parse_meesho_products(
    data: BulkParseRequest,
    admin: Admin = Depends(get_current_admin)
):
    raw = data.raw_text.strip()
    if not raw:
        return {"items": [], "count": 0}

    blocks = []
    if "---" in raw:
        blocks = [b.strip() for b in raw.split("---") if b.strip()]
    elif "\n\n" in raw:
        blocks = [b.strip() for b in raw.split("\n\n") if b.strip()]
    else:
        lines = [line.strip() for line in raw.splitlines() if line.strip()]
        blocks = lines if lines else [raw]

    parsed_items = []
    for b in blocks:
        try:
            p = parse_meesho_data(b, margin_percent=60.0)
            if p.get("name"):
                if data.default_markup and p.get("purchase_cost", 0) > 0:
                    cost = p["purchase_cost"]
                    p["selling_price"] = cost + data.default_markup
                    p["original_price"] = p["selling_price"] + 200
                parsed_items.append(p)
        except Exception:
            continue

    return {"items": parsed_items, "count": len(parsed_items)}


@router.get("/admin/backup-all")
def backup_all_products(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    products = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.variants),
        joinedload(Product.category)
    ).all()

    backup_data = []
    for p in products:
        backup_data.append({
            "name": p.name,
            "description": p.description,
            "category_slug": p.category.slug if p.category else None,
            "purchase_cost": p.purchase_cost,
            "selling_price": p.selling_price,
            "original_price": p.original_price,
            "discount_percentage": p.discount_percentage,
            "meesho_link": p.meesho_link,
            "is_featured": p.is_featured,
            "is_active": p.is_active,
            "cod_available": p.cod_available,
            "stock_quantity": p.stock_quantity,
            "images": [img.image_url for img in p.images],
            "sizes": [v.value for v in p.variants if v.variant_type == "size"],
            "colors": [v.value for v in p.variants if v.variant_type == "color"]
        })

    return {"count": len(backup_data), "products": backup_data}


class RestoreProductsRequest(BaseModel):
    products: List[Dict[str, Any]]


@router.post("/admin/restore-all")
def restore_all_products(
    data: RestoreProductsRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    from ....models.category import Category
    restored_count = 0

    for item in data.products:
        name = item.get("name")
        if not name:
            continue

        existing = db.query(Product).filter(Product.name == name).first()
        if existing:
            continue

        cat_slug = item.get("category_slug")
        cat = db.query(Category).filter(Category.slug == cat_slug).first() if cat_slug else None

        slug = make_slug(name, db)
        cost = float(item.get("purchase_cost", 0.0))
        selling = float(item.get("selling_price", 0.0))
        orig = float(item.get("original_price") or (selling + 200))
        disc = round(((orig - selling) / orig) * 100, 1) if orig > selling else 0.0

        p = Product(
            name=name,
            slug=slug,
            description=item.get("description"),
            category_id=cat.id if cat else None,
            purchase_cost=cost,
            selling_price=selling,
            original_price=orig,
            discount_percentage=disc,
            meesho_link=item.get("meesho_link"),
            is_active=item.get("is_active", True),
            is_featured=item.get("is_featured", False),
            cod_available=item.get("cod_available", True),
            stock_quantity=item.get("stock_quantity", 100)
        )
        db.add(p)
        db.flush()

        for idx, img_url in enumerate(item.get("images", [])):
            if img_url:
                db.add(ProductImage(
                    product_id=p.id,
                    image_url=img_url,
                    is_primary=(idx == 0),
                    sort_order=idx
                ))

        for s in item.get("sizes", []):
            if s:
                db.add(ProductVariant(
                    product_id=p.id,
                    variant_type="size",
                    value=s,
                    is_available=True
                ))

        for c in item.get("colors", []):
            if c:
                db.add(ProductVariant(
                    product_id=p.id,
                    variant_type="color",
                    value=c,
                    is_available=True
                ))

        restored_count += 1

    db.commit()
    return {"success": True, "restored_count": restored_count}
