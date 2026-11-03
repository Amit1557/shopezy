from ..database.database import engine, Base, SessionLocal
from ..models import (
    Admin,
    Category,
    Product,
    ProductImage,
    ProductVariant,
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

        # Seed initial sample products if table is completely empty
        if db.query(Product).count() == 0:
            sample_prods = [
                {
                    "name": "Men Regular Fit Solid Spread Collar Casual Cotton Shirt",
                    "slug": "men-regular-fit-solid-spread-collar-casual-cotton-shirt",
                    "category_slug": "mens-fashion",
                    "purchase_cost": 270.0,
                    "selling_price": 499.0,
                    "original_price": 999.0,
                    "discount_percentage": 50.0,
                    "image": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
                    "sizes": ["S", "M", "L", "XL"]
                },
                {
                    "name": "Women Floral Print Pure Georgette Anarkali Kurta with Dupatta Set",
                    "slug": "women-floral-print-pure-georgette-anarkali-kurta-with-dupatta-set",
                    "category_slug": "womens-fashion",
                    "purchase_cost": 480.0,
                    "selling_price": 899.0,
                    "original_price": 1899.0,
                    "discount_percentage": 53.0,
                    "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
                    "sizes": ["M", "L", "XL", "XXL"]
                },
                {
                    "name": "Men Lightweight Breathable Mesh Running & Sports Shoes",
                    "slug": "men-lightweight-breathable-mesh-running-sports-shoes",
                    "category_slug": "footwear",
                    "purchase_cost": 360.0,
                    "selling_price": 699.0,
                    "original_price": 1499.0,
                    "discount_percentage": 53.0,
                    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
                    "sizes": ["UK 6", "UK 7", "UK 8", "UK 9"]
                },
                {
                    "name": "Kids Pure Cotton Graphic Printed T-Shirt & Shorts Summer Set",
                    "slug": "kids-pure-cotton-graphic-printed-t-shirt-shorts-summer-set",
                    "category_slug": "kids-fashion",
                    "purchase_cost": 210.0,
                    "selling_price": 399.0,
                    "original_price": 799.0,
                    "discount_percentage": 50.0,
                    "image": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
                    "sizes": ["2-3 Y", "3-4 Y", "4-5 Y"]
                },
                {
                    "name": "Analog Chronograph Design Waterproof Stainless Steel Watch for Men",
                    "slug": "analog-chronograph-design-waterproof-stainless-steel-watch-for-men",
                    "category_slug": "accessories",
                    "purchase_cost": 310.0,
                    "selling_price": 599.0,
                    "original_price": 1299.0,
                    "discount_percentage": 54.0,
                    "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80",
                    "sizes": ["Free Size"]
                },
                {
                    "name": "Electric Mini Portable Vegetable Chopper & Garlic Crusher (250ml)",
                    "slug": "electric-mini-portable-vegetable-chopper-garlic-crusher-250ml",
                    "category_slug": "home-kitchen",
                    "purchase_cost": 190.0,
                    "selling_price": 389.0,
                    "original_price": 699.0,
                    "discount_percentage": 44.0,
                    "image": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
                    "sizes": ["Free Size"]
                },
                {
                    "name": "Men Slim Fit Washed Denim Jacket",
                    "slug": "men-slim-fit-washed-denim-jacket",
                    "category_slug": "mens-fashion",
                    "purchase_cost": 450.0,
                    "selling_price": 899.0,
                    "original_price": 1799.0,
                    "discount_percentage": 50.0,
                    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
                    "sizes": ["M", "L", "XL"]
                }
            ]

            for sp in sample_prods:
                cat = db.query(Category).filter(Category.slug == sp["category_slug"]).first()
                if cat:
                    p = Product(
                        name=sp["name"],
                        slug=sp["slug"],
                        category_id=cat.id,
                        purchase_cost=sp["purchase_cost"],
                        selling_price=sp["selling_price"],
                        original_price=sp["original_price"],
                        discount_percentage=sp["discount_percentage"],
                        description=f"Premium high-quality {sp['name']}. Sourced with verified standards and doorstep Cash on Delivery (COD).",
                        is_active=True,
                        cod_available=True,
                        stock_quantity=100
                    )
                    db.add(p)
                    db.flush()
                    db.add(ProductImage(product_id=p.id, image_url=sp["image"], is_primary=True, sort_order=0))
                    for sz in sp["sizes"]:
                        db.add(ProductVariant(product_id=p.id, variant_type="size", value=sz, is_available=True))
        
        db.commit()
        print("Database initialized successfully!")
    finally:
        db.close()

