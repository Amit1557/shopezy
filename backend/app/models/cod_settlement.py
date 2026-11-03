from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.database import Base


class CodSettlement(Base):
    __tablename__ = "cod_settlements"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    collected_amount = Column(Float, nullable=True)
    settlement_date = Column(DateTime(timezone=True), nullable=True)
    deductions = Column(Float, default=0.0)
    net_settled = Column(Float, nullable=True)
    is_settled = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    order = relationship("Order", back_populates="cod_settlement")
