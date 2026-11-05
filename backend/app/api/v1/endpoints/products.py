from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_, and_, func
from typing import List, Optional, Dict, Any
import os, uuid, re
from ....database.database import get_db
from ....models.product import Product, ProductImage, ProductVariant
from ....models.admin import Admin
from ....schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductPublic,
    ProductAdmin,
    ProductVariantCreate,
    ProductPublicDetail,
)
from .deps import get_current_admin
from ....core.config import settings

router = APIRouter()


def make_slug(name: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    slug = base
    i = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base}-{i}"
        i += 1
    return slug


# PUBLIC endpoints
@router.get("/public", response_model=dict)
def get_public_products(
    page: int = 1,
    limit: int = 20,
    category_id: Optional[int] = None,
    category_slug: Optional[str] = None,
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

    if category_id:
        base_q = base_q.filter(Product.category_id == category_id)
    elif category_slug and category_slug != 'popular':
        from ....models.category import Category
        cat = db.query(Category).filter(Category.slug == category_slug).first()
        if cat:
            base_q = base_q.filter(Product.category_id == cat.id)
    if search:
        base_q = base_q.filter(Product.name.ilike(f"%{search}%"))
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
                Product.variants.any(
                    and_(ProductVariant.variant_type == "color", ProductVariant.value.ilike(f"%{color}%"))
                ),
            )
        )
    if gender:
        base_q = base_q.filter(
            or_(
                Product.name.ilike(f"%{gender}%"),
                Product.description.ilike(f"%{gender}%"),
            )
        )
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
        .options(selectinload(Product.images), selectinload(Product.variants))
        .filter(Product.slug == slug, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(404, "Product not found")
    return product


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
    product = Product(
        name=data.name,
        slug=slug,
        description=data.description,
        specifications=data.specifications,
        category_id=data.category_id,
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

    # 3. Create Product
    product = Product(
        name=data.name,
        slug=slug,
        description=data.description or f"Trendy and premium quality {data.name}. Sourced with verified quality checks, comfortable wear and doorstep COD delivery.",
        specifications=data.specifications or {},
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

    # 4. Attach Images
    img_urls = [u.strip() for u in data.images if u.strip()]
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

        product = Product(
            name=item.name.strip(),
            slug=slug,
            description=item.description or f"Premium quality {item.name.strip()}. Verified quality check with doorstep Cash on Delivery.",
            specifications=item.specifications or {},
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

        img_urls = [u.strip() for u in item.images if u.strip()]
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
