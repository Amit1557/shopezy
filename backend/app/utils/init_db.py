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
        
        db.commit()
        print("Database initialized successfully!")
    finally:
        db.close()

