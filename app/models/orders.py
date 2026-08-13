


from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.db.base import Base
from app.models.product import Product
from sqlalchemy.orm import relationship

class Orders(Base):


    __tablename__ = "orders"
    # This is for the auto value like 1,2,3.... for uuid
    # id = Column(Integer, primary_key=True, autoincrement=True)
    id = Column("order_id", String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product = Column("product_id", Integer, ForeignKey("products.id"), nullable=False,
            index=True)
    user = Column("user_id", Integer, ForeignKey("users.id"),nullable=False,
            index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    quantity = Column(Integer, default=1)
    # making the relations with actual table 
    order_product = relationship("Product", back_populates="product_order")
    order_user = relationship("User", back_populates="users_order")