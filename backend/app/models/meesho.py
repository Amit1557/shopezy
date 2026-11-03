from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.database import Base


class MeeshoFulfilment(Base):
    __tablename__ = "meesho_fulfilment"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    meesho_order_id = Column(String(255), nullable=True, index=True)
    meesho_product_link = Column(String(1000), nullable=True)
    actual_purchase_cost = Column(Float, nullable=True)
    reselling_margin = Column(Float, nullable=True)
    order_placed_date = Column(DateTime(timezone=True), nullable=True)
    expected_delivery_date = Column(DateTime(timezone=True), nullable=True)
    tracking_info = Column(String(500), nullable=True)
    is_ordered_on_meesho = Column(Boolean, default=False)
    internal_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    order = relationship("Order", back_populates="meesho_fulfilment")
