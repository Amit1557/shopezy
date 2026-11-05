from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None
    quantity: int = 1


class OrderCreate(BaseModel):
    customer_name: str
    customer_mobile: str
    customer_alternate_mobile: Optional[str] = None
    flat_number: str
    street: str
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    otp_verified: Optional[bool] = True
    otp: Optional[str] = None
    items: List[OrderItemCreate]

    @validator("customer_mobile")
    def validate_mobile(cls, v):
        import re
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Invalid Indian mobile number")
        return v

    @validator("pincode")
    def validate_pincode(cls, v):
        import re
        if not re.match(r"^\d{6}$", v):
            raise ValueError("PIN code must be 6 digits")
        return v


class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    product_image: Optional[str]
    selected_size: Optional[str]
    selected_color: Optional[str]
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True


class OrderStatusHistoryOut(BaseModel):
    id: int
    status: str
    note: Optional[str]
    changed_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class MeeshoFulfilmentOut(BaseModel):
    id: int
    meesho_order_id: Optional[str]
    actual_purchase_cost: Optional[float]
    reselling_margin: Optional[float]
    order_placed_date: Optional[datetime]
    expected_delivery_date: Optional[datetime]
    tracking_info: Optional[str]
    is_ordered_on_meesho: bool
    internal_notes: Optional[str]

    class Config:
        from_attributes = True


class CustomerOut(BaseModel):
    id: int
    name: str
    mobile: str
    alternate_mobile: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_id: str
    customer_id: int
    status: str
    payment_method: str
    total_amount: float
    delivery_charges: float
    flat_number: str
    street: str
    landmark: Optional[str]
    city: str
    state: str
    pincode: str
    admin_notes: Optional[str]
    cancellation_reason: Optional[str]
    return_reason: Optional[str] = None
    return_requested_at: Optional[datetime] = None
    return_admin_notes: Optional[str] = None
    otp_verified: Optional[bool] = True
    created_at: datetime
    updated_at: Optional[datetime]
    customer: CustomerOut
    items: List[OrderItemOut] = []
    status_history: List[OrderStatusHistoryOut] = []
    meesho_fulfilment: Optional[MeeshoFulfilmentOut]

    class Config:
        from_attributes = True


class OrderPublic(BaseModel):
    order_id: str
    status: str
    total_amount: float
    payment_method: str
    city: str
    state: str
    items: List[OrderItemOut] = []
    status_history: List[OrderStatusHistoryOut] = []
    return_reason: Optional[str] = None
    return_requested_at: Optional[datetime] = None
    created_at: datetime
    tracking_info: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReturnRequest(BaseModel):
    order_id: str
    mobile: str
    reason: str
    notes: Optional[str] = None


class CancelOrderRequest(BaseModel):
    order_id: str
    mobile: str
    reason: str
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class MeeshoFulfilmentUpdate(BaseModel):
    meesho_order_id: Optional[str] = None
    meesho_product_link: Optional[str] = None
    actual_purchase_cost: Optional[float] = None
    reselling_margin: Optional[float] = None
    order_placed_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None
    tracking_info: Optional[str] = None
    is_ordered_on_meesho: Optional[bool] = None
    internal_notes: Optional[str] = None
