from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.base import Base


class CartItem(Base):
    """
    A single line in a user's shopping cart.

    The cart is the PENDING state: clicking "Buy"/"Add to cart" inserts a
    row here. Only when the user approves (checkout) are these converted
    into rows in the `orders` table.
    """

    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True,
    )
    quantity = Column(Integer, nullable=False, default=1)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships mirror the User and Product sides so we can show the
    # product name/price inside the cart without extra queries.
    cart_user = relationship("User", back_populates="user_cart")
    cart_product = relationship("Product", back_populates="product_cart")
