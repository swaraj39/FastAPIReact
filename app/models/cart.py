from datetime import datetime, timezone
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.db.base import Base
from sqlalchemy.orm import relationship

class Cart(Base):
    __tablename__ = "cart"

    id = Column("order_id", String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product = Column("product_id", Integer, ForeignKey("products.id"), nullable=False,
                index=True)
    user = Column("user_id", Integer, ForeignKey("users.id"),nullable=False,
                index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    buyed = Column("ordered",Boolean, nullable=False)
    quantity = Column("quantity", Integer, default=1)


    # making the relations with actual table 
    order_product = relationship("Product", back_populates="product_order")
    order_user = relationship("User", back_populates="users_order")