from sqlalchemy import Column, ForeignKey, Integer, Table

from app.db.base import Base

# ----------------------------------------------------------------------
# MANY-TO-MANY association table: User <-> Product (favorites).
#
# A User can favorite MANY Products, and a Product can be favorited by
# MANY Users. No Model class is needed here - just a plain Table whose
# two foreign keys form a composite primary key. It guarantees a user
# cannot favorite the same product twice.
#
# `ondelete="CASCADE"` at the DATABASE level: if a User or Product row
# is deleted, its rows in this table are removed automatically.
# ----------------------------------------------------------------------
user_favorites = Table(
    "user_favorites",
    Base.metadata,
    Column(
        "user_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "product_id",
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
