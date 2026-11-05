from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.database import Base


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False, index=True)
    slug = Column(String(500), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    specifications = Column(JSON, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    purchase_cost = Column(Float, default=0.0)  # admin only - never exposed to customer
    selling_price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)  # MRP/reference price shown to customer
    discount_percentage = Column(Float, default=0.0)
    meesho_link = Column(String(1000), nullable=True)  # admin only
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    cod_available = Column(Boolean, default=True)
    stock_quantity = Column(Integer, default=100)
    total_orders = Column(Integer, default=0)
    average_rating = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("ProductReview", back_populates="product", cascade="all, delete-orphan", order_by="desc(ProductReview.created_at)")
    order_items = relationship("OrderItem", back_populates="product")


class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_url = Column(String(1000), nullable=False)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product = relationship("Product", back_populates="images")


class ProductVariant(Base):
    __tablename__ = "product_variants"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_type = Column(String(50), nullable=False)  # "size" or "color"
    value = Column(String(100), nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product = relationship("Product", back_populates="variants")


class ProductReview(Base):
    __tablename__ = "product_reviews"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    customer_name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False, default=5)  # 1 to 5
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=False)
    is_verified_buyer = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product = relationship("Product", back_populates="reviews")
