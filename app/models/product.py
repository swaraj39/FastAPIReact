from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Product(Base):
    """
    A Product belongs to exactly one User.

    This is the MANY side of the User one-to-many relationship, so from
    Product's point of view it is a MANY-TO-ONE relationship:
      * MANY Products -> ONE User (the `owner`)

    Because a Product holds a `owner_id` foreign key, it is said to own
    the relationship on the database level.
    """

    __tablename__ = "products"

    # Primary key - unique id for this product row.
    id = Column(Integer, primary_key=True, index=True)

    # The product's display name.
    name = Column(String(100), nullable=False, index=True)

    # Optional longer description (nullable means it may be NULL).
    description = Column(Text, nullable=True)

    # The price as a floating point number.
    price = Column(Float, nullable=False)

    # ------------------------------------------------------------------
    # FOREIGN KEY - this is the column that links Product back to User.
    # ------------------------------------------------------------------
    # `ForeignKey("users.id")` tells SQLAlchemy/DB that this value MUST
    # match an existing User.id. The DB enforces the relationship.
    # `index=True` speeds up queries like "give me all products owned by
    # user X" (that query is what the /products?owner_id=... endpoint runs).
    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # ------------------------------------------------------------------
    # MANY-TO-ONE relationship (many Products -> one User)
    # ------------------------------------------------------------------
    # `back_populates="products"` mirrors the `User.products` list we
    # defined in user.py. Thanks to this, `product.owner` returns the
    # User object that owns this product.
    #
    # NOTE: this side has NO cascade. Cascades belong on the "parent"
    # side (User.products), because a child Product must never delete
    # its parent User.
    owner = relationship("User", back_populates="products")
