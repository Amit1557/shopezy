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
        
        # Create default Meesho-aligned categories
        default_categories = [
            {"name": "Kurti, Saree & Lehenga", "slug": "kurti-saree-lehenga", "icon": "dress"},
            {"name": "Women Western", "slug": "women-western", "icon": "dress"},
            {"name": "Lingerie", "slug": "lingerie", "icon": "heart"},
            {"name": "Men", "slug": "men", "icon": "shirt"},
            {"name": "Kids & Toys", "slug": "kids-toys", "icon": "baby"},
            {"name": "Home & Kitchen", "slug": "home-kitchen", "icon": "home"},
            {"name": "Beauty & Health", "slug": "beauty-health", "icon": "sparkles"},
            {"name": "Jewellery & Accessories", "slug": "jewellery-accessories", "icon": "watch"},
            {"name": "Bags & Footwear", "slug": "bags-footwear", "icon": "footwear"},
            {"name": "Electronics", "slug": "electronics", "icon": "smartphone"},
            {"name": "Watches", "slug": "watches", "icon": "watch"},
            {"name": "Sports & Fitness", "slug": "sports-fitness", "icon": "dumbbell"},
            {"name": "Men's Fashion", "slug": "mens-fashion", "icon": "shirt"},
            {"name": "Women's Fashion", "slug": "womens-fashion", "icon": "dress"},
            {"name": "Footwear", "slug": "footwear", "icon": "footwear"},
            {"name": "Accessories", "slug": "accessories", "icon": "watch"},
            {"name": "Kids' Fashion", "slug": "kids-fashion", "icon": "baby"},
            {"name": "Beauty & Lifestyle", "slug": "beauty-lifestyle", "icon": "sparkles"},
        ]
        for i, cat_data in enumerate(default_categories):
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                cat = Category(sort_order=i, **cat_data)
                db.add(cat)
        db.flush()

        # Auto-realign any miscategorized products across the database
        try:
            from sqlalchemy import or_
            cat_map = {c.slug: c.id for c in db.query(Category).all()}
            home_id = cat_map.get("home-kitchen")
            elec_id = cat_map.get("electronics")
            jewel_id = cat_map.get("jewellery-accessories")
            kurti_id = cat_map.get("kurti-saree-lehenga")

            # 1. Realign Home & Kitchen products trapped in Electronics or Kurti
            if home_id:
                home_kws = [
                    "%bedsheet%", "%bed sheet%", "%fitted sheet%", "%microfiber%", "%microfibre%",
                    "%cleaning cloth%", "%cloth pack%", "%bangle stand%", "%cushion%", "%curtain%",
                    "%wall clock%", "%clock%", "%pillow%", "%blanket%", "%quilt%", "%mattress%",
                    "%artificial plant%", "%planter%", "%shoe rack%", "%sofa cover%", "%mop%",
                    "%cookware%", "%kadhai%", "%water bottle%"
                ]
                filters = [Product.name.ilike(kw) for kw in home_kws]
                misplaced_home = db.query(Product).filter(
                    Product.category_id.in_([elec_id, kurti_id] if elec_id and kurti_id else [home_id]),
                    Product.category_id != home_id,
                    or_(*filters)
                ).all()
                for prod in misplaced_home:
                    prod.category_id = home_id

            # 2. Realign Electronic Gadgets trapped in Kurti or other fashion categories
            if elec_id:
                elec_kws = [
                    "%speaker%", "%earphone%", "%headphone%", "%earbud%", "%airpod%",
                    "%tws%", "%bluetooth%", "%charger%", "%usb%", "%cable%", "%adapter%",
                    "%neckband%", "%power bank%", "%soundbar%", "%aux cable%", "%mouse%",
                    "%keyboard%", "%smart watch%", "%smartwatch%", "%modesk%", "%tripod%",
                    "%portronics%", "%ubon%"
                ]
                filters = [Product.name.ilike(kw) for kw in elec_kws]
                misplaced_elec = db.query(Product).filter(
                    Product.category_id != elec_id,
                    or_(*filters)
                ).all()
                for prod in misplaced_elec:
                    prod.category_id = elec_id

            # 3. Realign Scarves & Stoles trapped in Kurti into Jewellery & Accessories
            if jewel_id and kurti_id:
                scarf_kws = ["%scarf%", "%scarves%", "%stole%", "%stoles%"]
                filters = [Product.name.ilike(kw) for kw in scarf_kws]
                misplaced_scarves = db.query(Product).filter(
                    Product.category_id == kurti_id,
                    or_(*filters)
                ).all()
                for prod in misplaced_scarves:
                    prod.category_id = jewel_id

            # 4. Deduplicate products: If same product title appears multiple times, remove extra duplicates
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

