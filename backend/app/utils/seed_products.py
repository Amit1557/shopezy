import os
from sqlalchemy.orm import Session
from ..database.database import SessionLocal
from ..models import Product, ProductImage, ProductVariant, Category

SAMPLE_PRODUCTS = [
    {
        "name": "Men Regular Fit Solid Spread Collar Casual Cotton Shirt",
        "category_slug": "mens-fashion",
        "purchase_cost": 270.0,
        "selling_price": 499.0,
        "original_price": 999.0,
        "discount_percentage": 50.0,
        "description": "Premium 100% pure combed cotton casual shirt for men. Features classic spread collar, curved hemline, full sleeves with button cuffs, and single chest pocket. Breathable fabric perfect for daily office and casual outings.",
        "specifications": {
            "Fabric": "100% Pure Cotton",
            "Fit": "Regular Fit",
            "Pattern": "Solid",
            "Sleeve": "Long Sleeves",
            "Collar": "Spread Collar",
            "Care Instructions": "Machine wash cold with like colors"
        },
        "meesho_link": "https://meesho.com/s/p/sample-shirt-1",
        "is_featured": True,
        "cod_available": True,
        "stock_quantity": 45,
        "average_rating": 4.3,
        "images": [
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1620012253295-c15c429f66bf?auto=format&fit=crop&w=800&q=80"
        ],
        "sizes": ["M", "L", "XL", "XXL"],
        "colors": ["Navy Blue", "Olive Green", "White"]
    },
    {
        "name": "Women Floral Print Pure Georgette Anarkali Kurta with Dupatta Set",
        "category_slug": "womens-fashion",
        "purchase_cost": 480.0,
        "selling_price": 899.0,
        "original_price": 1899.0,
        "discount_percentage": 53.0,
        "description": "Stunning floral printed Anarkali Kurta set crafted from lightweight flowy georgette fabric. Comes with matching flared dupatta with lace border. Soft santoon inner lining for all-day comfort during festive gatherings and weddings.",
        "specifications": {
            "Kurta Fabric": "Georgette with Santoon Lining",
            "Dupatta Fabric": "Georgette",
            "Work": "Digital Floral Print with Gota Patti Lace",
            "Length": "Calf Length (48 inches)",
            "Neck": "Round Neck",
            "Care Instructions": "Dry clean recommended or gentle hand wash"
        },
        "meesho_link": "https://meesho.com/s/p/anarkali-set-2",
        "is_featured": True,
        "cod_available": True,
        "stock_quantity": 30,
        "average_rating": 4.6,
        "images": [
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
        ],
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Blush Pink", "Lavender", "Teal"]
    },
    {
        "name": "Men Lightweight Breathable Mesh Running & Sports Shoes",
        "category_slug": "footwear",
        "purchase_cost": 360.0,
        "selling_price": 699.0,
        "original_price": 1499.0,
        "discount_percentage": 53.0,
        "description": "Engineered for active lifestyles. Features breathable air-mesh upper that keeps feet cool and dry, shock-absorbing cushioned EVA midsole, and high-grip anti-skid rubber outsole. Ideal for running, gym workouts, and casual walks.",
        "specifications": {
            "Upper Material": "Breathable Air Mesh",
            "Sole Material": "High Bounce EVA & Rubber",
            "Closure": "Lace-Up",
            "Weight": "Approx 480g per pair",
            "Occasion": "Running / Walking / Gym"
        },
        "meesho_link": "https://meesho.com/s/p/running-shoes-3",
        "is_featured": True,
        "cod_available": True,
        "stock_quantity": 60,
        "average_rating": 4.4,
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80"
        ],
        "sizes": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
        "colors": ["Black & White", "Grey & Neon", "All Black"]
    },
    {
        "name": "Kids Pure Cotton Graphic Printed T-Shirt & Shorts Summer Set",
        "category_slug": "kids-fashion",
        "purchase_cost": 210.0,
        "selling_price": 399.0,
        "original_price": 799.0,
        "discount_percentage": 50.0,
        "description": "Ultra-soft 100% bio-washed cotton 2-piece clothing set for kids. Non-toxic water-based prints safe on delicate skin. Elasticated waistband on shorts for easy pull-on dressing and all-day comfort.",
        "specifications": {
            "Material": "100% Bio-Washed Combed Cotton",
            "Fit": "Regular Relaxed Fit",
            "Set Includes": "1 T-Shirt + 1 Shorts",
            "Age Group": "2 to 8 Years",
            "Care Instructions": "Machine wash gentle cycle"
        },
        "meesho_link": "https://meesho.com/s/p/kids-set-4",
        "is_featured": False,
        "cod_available": True,
        "stock_quantity": 40,
        "average_rating": 4.5,
        "images": [
            "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80"
        ],
        "sizes": ["2-3 Y", "4-5 Y", "6-7 Y"],
        "colors": ["Yellow & Navy", "Sky Blue & Grey"]
    },
    {
        "name": "Analog Chronograph Design Waterproof Stainless Steel Watch for Men",
        "category_slug": "accessories",
        "purchase_cost": 310.0,
        "selling_price": 599.0,
        "original_price": 1299.0,
        "discount_percentage": 54.0,
        "description": "Luxury aesthetic watch with durable stainless steel mesh strap and scratch-resistant hardlex mineral dial window. Quartz movement for accurate timekeeping. 30M daily water resistance.",
        "specifications": {
            "Dial Diameter": "42 mm",
            "Strap Material": "Stainless Steel Mesh",
            "Movement": "Japanese Quartz",
            "Water Resistance": "3 ATM (Splash proof)",
            "Warranty": "6 Months Seller Warranty"
        },
        "meesho_link": "https://meesho.com/s/p/mens-watch-5",
        "is_featured": True,
        "cod_available": True,
        "stock_quantity": 50,
        "average_rating": 4.2,
        "images": [
            "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80"
        ],
        "sizes": ["Free Size"],
        "colors": ["Black Dial & Silver Strap", "All Black", "Blue Dial & Rose Gold"]
    },
    {
        "name": "Electric Mini Portable Vegetable Chopper & Garlic Crusher (250ml)",
        "category_slug": "home-kitchen",
        "purchase_cost": 190.0,
        "selling_price": 389.0,
        "original_price": 699.0,
        "discount_percentage": 44.0,
        "description": "Rechargeable wireless electric chopper equipped with 3 sharp stainless steel reinforced blades. One-touch operation chops garlic, onions, ginger, nuts and chillies in under 10 seconds. USB rechargeable.",
        "specifications": {
            "Capacity": "250 ml",
            "Blade Material": "304 Food Grade Stainless Steel",
            "Battery": "1200mAh USB Rechargeable",
            "Safety": "Magnetic sensor auto-shutoff",
            "Weight": "280g"
        },
        "meesho_link": "https://meesho.com/s/p/mini-chopper-6",
        "is_featured": False,
        "cod_available": True,
        "stock_quantity": 75,
        "average_rating": 4.1,
        "images": [
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
        ],
        "sizes": ["250ml Standard"],
        "colors": ["Mint Green", "White", "Pink"]
    }
]

def seed_sample_products():
    db: Session = SessionLocal()
    try:
        # Check if products already exist
        if db.query(Product).count() > 0:
            print("Products already seeded, skipping.")
            return

        for p_data in SAMPLE_PRODUCTS:
            category = db.query(Category).filter(Category.slug == p_data["category_slug"]).first()
            if not category:
                continue

            import re
            slug = re.sub(r'[^a-z0-9]+', '-', p_data["name"].lower()).strip('-')
            
            product = Product(
                name=p_data["name"],
                slug=slug,
                description=p_data["description"],
                specifications=p_data["specifications"],
                category_id=category.id,
                purchase_cost=p_data["purchase_cost"],
                selling_price=p_data["selling_price"],
                original_price=p_data["original_price"],
                discount_percentage=p_data["discount_percentage"],
                meesho_link=p_data["meesho_link"],
                is_active=True,
                is_featured=p_data["is_featured"],
                cod_available=p_data["cod_available"],
                stock_quantity=p_data["stock_quantity"],
                average_rating=p_data["average_rating"],
                total_orders=12
            )
            db.add(product)
            db.flush()

            for i, img_url in enumerate(p_data["images"]):
                img = ProductImage(
                    product_id=product.id,
                    image_url=img_url,
                    is_primary=(i == 0),
                    sort_order=i
                )
                db.add(img)

            for size in p_data.get("sizes", []):
                variant = ProductVariant(
                    product_id=product.id,
                    variant_type="size",
                    value=size,
                    is_available=True
                )
                db.add(variant)

            for color in p_data.get("colors", []):
                variant = ProductVariant(
                    product_id=product.id,
                    variant_type="color",
                    value=color,
                    is_available=True
                )
                db.add(variant)

        db.commit()
        print(f"Successfully seeded {len(SAMPLE_PRODUCTS)} sample products!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_sample_products()

