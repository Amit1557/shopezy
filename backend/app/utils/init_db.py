from ..database.database import engine, Base, SessionLocal
from ..models import (
    Admin,
    Category,
    Product,
    ProductImage,
    ProductVariant,
    ProductReview,
    Customer,
    CustomerAddress,
    Order,
    OrderItem,
    OrderStatusHistory,
    MeeshoFulfilment,
    Expense,
    CodSettlement
)
from ..core.security import get_password_hash
from ..core.config import settings

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Safe migration for tags column if not exists
        try:
            from sqlalchemy import text
            if "sqlite" in str(engine.url):
                try:
                    db.execute(text("ALTER TABLE products ADD COLUMN tags JSON DEFAULT '[]';"))
                    db.commit()
                except Exception:
                    db.rollback()
            else:
                try:
                    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;"))
                    db.commit()
                except Exception:
                    try:
                        db.rollback()
                        db.execute(text("ALTER TABLE products ADD COLUMN tags JSON DEFAULT '[]';"))
                        db.commit()
                    except Exception:
                        db.rollback()
        except Exception:
            db.rollback()

        # Create default admin
        admin = db.query(Admin).filter(Admin.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = Admin(
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                name="Store Admin"
            )
            db.add(admin)
        
        # Create & Align default Meesho front-page categories
        default_categories = [
            {"name": "Ethnic Wear", "slug": "kurti-saree-lehenga", "icon": "dress", "sort_order": 0},
            {"name": "Western Dresses", "slug": "women-western", "icon": "dress", "sort_order": 1},
            {"name": "Menswear", "slug": "men", "icon": "shirt", "sort_order": 2},
            {"name": "Footwear", "slug": "footwear", "icon": "footwear", "sort_order": 3},
            {"name": "Home Decor", "slug": "home-kitchen", "icon": "home", "sort_order": 4},
            {"name": "Beauty", "slug": "beauty-health", "icon": "sparkles", "sort_order": 5},
            {"name": "Accessories", "slug": "jewellery-accessories", "icon": "watch", "sort_order": 6},
            {"name": "Electronics", "slug": "electronics", "icon": "smartphone", "sort_order": 7},
            {"name": "Kids & Toys", "slug": "kids-toys", "icon": "baby", "sort_order": 8},
            {"name": "Watches", "slug": "watches", "icon": "watch", "sort_order": 9},
            {"name": "Sports & Fitness", "slug": "sports-fitness", "icon": "dumbbell", "sort_order": 10},
        ]
        core_slugs = {c["slug"] for c in default_categories}
        for cat_data in default_categories:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                cat = Category(is_active=True, **cat_data)
                db.add(cat)
            else:
                existing.name = cat_data["name"]
                existing.sort_order = cat_data["sort_order"]
                existing.icon = cat_data["icon"]
                existing.is_active = True
        db.flush()

        # Deactivate redundant duplicate categories so storefront shows clean 10 Meesho categories
        all_cats = db.query(Category).all()
        for cat in all_cats:
            if cat.slug not in core_slugs:
                cat.is_active = False
        db.flush()

        # Auto-realign any miscategorized products across the database
        try:
            from sqlalchemy import or_, and_
            cat_map = {c.slug: c.id for c in db.query(Category).all()}
            home_id = cat_map.get("home-kitchen")
            elec_id = cat_map.get("electronics")
            jewel_id = cat_map.get("jewellery-accessories")
            kurti_id = cat_map.get("kurti-saree-lehenga")
            footwear_id = cat_map.get("footwear") or cat_map.get("bags-footwear")
            western_id = cat_map.get("women-western")
            men_id = cat_map.get("men")
            watch_id = cat_map.get("watches")

            # 0. Merge products from redundant categories into primary core categories
            if footwear_id and cat_map.get("bags-footwear"):
                db.query(Product).filter(Product.category_id == cat_map["bags-footwear"]).update({"category_id": footwear_id}, synchronize_session=False)
            if men_id and cat_map.get("mens-fashion"):
                db.query(Product).filter(Product.category_id == cat_map["mens-fashion"]).update({"category_id": men_id}, synchronize_session=False)
            if western_id and cat_map.get("womens-fashion"):
                db.query(Product).filter(Product.category_id == cat_map["womens-fashion"]).update({"category_id": western_id}, synchronize_session=False)
            if jewel_id and cat_map.get("accessories"):
                db.query(Product).filter(Product.category_id == cat_map["accessories"]).update({"category_id": jewel_id}, synchronize_session=False)
            if cat_map.get("beauty-health") and cat_map.get("beauty-lifestyle"):
                db.query(Product).filter(Product.category_id == cat_map["beauty-lifestyle"]).update({"category_id": cat_map["beauty-health"]}, synchronize_session=False)
            if cat_map.get("kids-toys") and cat_map.get("kids-fashion"):
                db.query(Product).filter(Product.category_id == cat_map["kids-fashion"]).update({"category_id": cat_map["kids-toys"]}, synchronize_session=False)
            db.flush()

            # 1. Realign Footwear (shoes, flats, heels, sandals, slippers, crocs, jutti) trapped in Men or elsewhere
            if footwear_id:
                fw_kws = [
                    "%shoe%", "%shoes%", "%sneaker%", "%sneakers%", "%sandal%", "%sandals%",
                    "%slipper%", "%slippers%", "%chappal%", "%chappals%", "%flat%", "%flats%",
                    "%heel%", "%heels%", "%wedge%", "%wedges%", "%crocs%", "%slide%", "%slides%",
                    "%loafer%", "%loafers%", "%mojari%", "%jutti%", "%bellies%", "%footwear%"
                ]
                filters = [Product.name.ilike(kw) for kw in fw_kws]
                misplaced_fw = db.query(Product).filter(Product.category_id != footwear_id, or_(*filters)).all()
                for prod in misplaced_fw:
                    prod.category_id = footwear_id
                    # Clean out clothing sizes and add IND shoe sizes
                    for v in list(prod.variants):
                        if v.variant_type == "size" and v.value in ["S", "M", "L", "XL", "XXL"]:
                            db.delete(v)
                    is_women = any(w in prod.name.lower() for w in ["women", "woman", "girl", "girls", "ladies", "flat", "heel", "wedge", "belli"])
                    new_sizes = ["IND-4", "IND-5", "IND-6", "IND-7", "IND-8"] if is_women else ["IND-6", "IND-7", "IND-8", "IND-9", "IND-10"]
                    existing_vals = {v.value for v in prod.variants if v.variant_type == "size"}
                    for sz in new_sizes:
                        if sz not in existing_vals:
                            db.add(ProductVariant(product_id=prod.id, variant_type="size", value=sz, is_available=True))

            # 2. Realign Home & Kitchen / Home Decor products trapped in Electronics, Men, or Kurti
            if home_id:
                home_kws = [
                    "%bedsheet%", "%bed sheet%", "%fitted sheet%", "%microfiber%", "%microfibre%",
                    "%cleaning cloth%", "%cloth pack%", "%bangle stand%", "%cushion%", "%curtain%",
                    "%wall clock%", "%clock%", "%pillow%", "%blanket%", "%quilt%", "%mattress%",
                    "%artificial plant%", "%planter%", "%shoe rack%", "%sofa cover%", "%mop%",
                    "%cookware%", "%kadhai%", "%water bottle%"
                ]
                filters = [Product.name.ilike(kw) for kw in home_kws]
                misplaced_home = db.query(Product).filter(Product.category_id != home_id, or_(*filters)).all()
                for prod in misplaced_home:
                    prod.category_id = home_id

            # 3. Realign Electronic Gadgets trapped in Kurti or other fashion categories
            if elec_id:
                elec_kws = [
                    "%speaker%", "%earphone%", "%headphone%", "%earbud%", "%airpod%",
                    "%tws%", "%bluetooth%", "%charger%", "%usb%", "%cable%", "%adapter%",
                    "%neckband%", "%power bank%", "%soundbar%", "%aux cable%", "%mouse%",
                    "%keyboard%", "%smart watch%", "%smartwatch%", "%modesk%", "%tripod%",
                    "%portronics%", "%ubon%"
                ]
                filters = [Product.name.ilike(kw) for kw in elec_kws]
                misplaced_elec = db.query(Product).filter(Product.category_id != elec_id, or_(*filters)).all()
                for prod in misplaced_elec:
                    prod.category_id = elec_id

            # 4. Realign Women / Girls Western clothing trapped in Men
            if western_id and men_id:
                women_kws = ["%women%", "%woman%", "%ladies%", "%girl%", "%girls%", "%female%"]
                men_kws = ["%men%", "%man%", "%gents%", "%boy%", "%male%"]
                misplaced_women_in_men = db.query(Product).filter(
                    Product.category_id == men_id,
                    or_(*[Product.name.ilike(kw) for kw in women_kws]),
                    ~or_(*[Product.name.ilike(kw) for kw in men_kws])
                ).all()
                for prod in misplaced_women_in_men:
                    prod.category_id = western_id

            # 5. Realign Perfumes, Fragrances & Beauty trapped in Kurti or other fashion categories
            beauty_id = cat_map.get("beauty-health")
            if beauty_id:
                beauty_kws = [
                    "%perfume%", "%parfum%", "%eau de%", "%cologne%", "%fragrance%",
                    "%attar%", "%ittar%", "%deodorant%", "%deo %", "%body mist%",
                    "%body spray%", "%lipstick%", "%kajal%", "%eyeliner%", "%mascara%",
                    "%foundation%", "%serum%", "%face wash%", "%facewash%", "%shampoo%",
                    "%skin care%", "%skincare%", "%hair oil%", "%lotion%", "%cream%"
                ]
                filters = [Product.name.ilike(kw) for kw in beauty_kws]
                misplaced_beauty = db.query(Product).filter(Product.category_id != beauty_id, or_(*filters)).all()
                for prod in misplaced_beauty:
                    prod.category_id = beauty_id
                    # Clean out clothing sizes and set to Free Size
                    for v in list(prod.variants):
                        if v.variant_type == "size" and v.value in ["S", "M", "L", "XL", "XXL", "3XL"]:
                            db.delete(v)
                    existing_vals = {v.value for v in prod.variants if v.variant_type == "size"}
                    if "Free Size" not in existing_vals and not existing_vals:
                        db.add(ProductVariant(product_id=prod.id, variant_type="size", value="Free Size", is_available=True))

            # 6. Guarantee Color and Size ProductVariant rows for all active products
            all_active = db.query(Product).filter(Product.is_active == True).all()
            for p in all_active:
                v_types = {v.variant_type for v in p.variants}
                p_name_lower = p.name.lower()
                is_p_fw = any(w in p_name_lower for w in ["shoe", "sneaker", "sandal", "slipper", "flat", "heel", "crocs", "slide", "footwear"])
                if "size" not in v_types:
                    if is_p_fw:
                        is_w = any(w in p_name_lower for w in ["women", "woman", "girl", "ladies", "flat", "heel", "wedge"])
                        sizes = ["IND-4", "IND-5", "IND-6", "IND-7", "IND-8"] if is_w else ["IND-6", "IND-7", "IND-8", "IND-9", "IND-10"]
                        for s in sizes:
                            db.add(ProductVariant(product_id=p.id, variant_type="size", value=s, is_available=True))
                    else:
                        db.add(ProductVariant(product_id=p.id, variant_type="size", value="Free Size", is_available=True))
                if "color" not in v_types:
                    # Detect color from name
                    col = "Black"
                    for c_candidate in ["Black", "White", "Blue", "Red", "Green", "Pink", "Yellow", "Grey", "Brown", "Purple"]:
                        if c_candidate.lower() in p_name_lower:
                            col = c_candidate
                            break
                    db.add(ProductVariant(product_id=p.id, variant_type="color", value=col, is_available=True))
                    specs = dict(p.specifications or {})
                    if "Color" not in specs:
                        specs["Color"] = col
                        p.specifications = specs

            # 6. Deduplicate products: If same product title appears multiple times, remove extra duplicates
            all_prods = db.query(Product).order_by(Product.id.asc()).all()
            seen_titles = {}
            duplicates_removed = 0
            for prod in all_prods:
                clean_title = prod.name.strip().lower()
                if clean_title in seen_titles:
                    db.delete(prod)
                    duplicates_removed += 1
                else:
                    seen_titles[clean_title] = prod.id
            if duplicates_removed > 0:
                db.commit()
                print(f"Removed {duplicates_removed} duplicate products.")

            db.commit()
            print("Successfully checked and auto-realigned catalog categories.")
        except Exception as e:
            print("Auto-realign error:", e)
            db.rollback()
        
        db.commit()
        print("Database initialized successfully!")
    finally:
        db.close()

