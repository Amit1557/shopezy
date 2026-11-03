from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductImageOut(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    sort_order: int

    class Config:
        from_attributes = True


class ProductVariantOut(BaseModel):
    id: int
    variant_type: str
    value: str
    is_available: bool

    class Config:
        from_attributes = True


class ProductVariantCreate(BaseModel):
    variant_type: str
    value: str
    is_available: bool = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    specifications: Optional[dict] = None
    category_id: Optional[int] = None
    purchase_cost: float = 0.0
    selling_price: float
    original_price: Optional[float] = None
    discount_percentage: float = 0.0
    meesho_link: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    cod_available: bool = True
    stock_quantity: int = 100
    variants: Optional[List[ProductVariantCreate]] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[dict] = None
    category_id: Optional[int] = None
    purchase_cost: Optional[float] = None
    selling_price: Optional[float] = None
    original_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    meesho_link: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    cod_available: Optional[bool] = None
    stock_quantity: Optional[int] = None


# Public product (NO purchase_cost, NO meesho_link exposed)
class ProductPublic(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    category_id: Optional[int]
    selling_price: float
    original_price: Optional[float]
    discount_percentage: float
    is_featured: bool
    cod_available: bool
    average_rating: Optional[float]
    total_orders: int
    images: List[ProductImageOut] = []
    variants: List[ProductVariantOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


class ProductPublicDetail(ProductPublic):
    specifications: Optional[dict]


# Admin product (includes internal cost data)
class ProductAdmin(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    specifications: Optional[dict]
    category_id: Optional[int]
    purchase_cost: float
    selling_price: float
    original_price: Optional[float]
    discount_percentage: float
    meesho_link: Optional[str]
    is_active: bool
    is_featured: bool
    cod_available: bool
    stock_quantity: int
    total_orders: int
    average_rating: Optional[float]
    images: List[ProductImageOut] = []
    variants: List[ProductVariantOut] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
