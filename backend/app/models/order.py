from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database.database import Base


class OrderStatus(str, enum.Enum):
    NEW = "NEW"
    CONFIRMED = "CONFIRMED"
    MEESHO_ORDERED = "MEESHO_ORDERED"
    SHIPPED = "SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    RETURN_REQUESTED = "RETURN_REQUESTED"
    RETURNED = "RETURNED"
    FAILED_DELIVERY = "FAILED_DELIVERY"


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, nullable=False, index=True)  # e.g., ORD-20240101-0001
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String(50), default=OrderStatus.NEW)
    payment_method = Column(String(50), default="COD")
    total_amount = Column(Float, nullable=False)
    delivery_charges = Column(Float, default=0.0)
    flat_number = Column(String(255), nullable=False)
    street = Column(String(500), nullable=False)
    landmark = Column(String(255), nullable=True)
    city = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    pincode = Column(String(10), nullable=False)
    admin_notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    return_reason = Column(Text, nullable=True)
    return_requested_at = Column(DateTime(timezone=True), nullable=True)
    return_admin_notes = Column(Text, nullable=True)
    otp_verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    meesho_fulfilment = relationship("MeeshoFulfilment", back_populates="order", uselist=False)
    cod_settlement = relationship("CodSettlement", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    # Snapshot fields - preserved even if product is edited/deleted
    product_name = Column(String(500), nullable=False)
    product_image = Column(String(1000), nullable=True)
    selected_size = Column(String(100), nullable=True)
    selected_color = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)  # Price at time of order
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    changed_by = Column(String(100), default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    order = relationship("Order", back_populates="status_history")
