from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.associations import user_favorites
from app.models.role import Role


class User(Base):
    """
    This is the "parent" side of two relationships:

      * ONE-TO-MANY  -> User has MANY Product rows (see `products` below)
      * ONE-TO-ONE   -> User has EXACTLY ONE Profile row   (see `profile` below)

    SQLAlchemy maps a row of the `users` table to this Python class.
    Each `Column(...)` below becomes a database column.
    """

    __tablename__ = "users"

    # Primary key - unique id that identifies every user row.
    id = Column(Integer, primary_key=True, index=True)

    # username is unique, so no two users can share the same name.
    # index=True creates a database index to speed up lookups by username.
    username = Column(String(50), unique=True, nullable=False, index=True)

    # Email is also unique (one email per user).
    email = Column(String(100), unique=True, nullable=False)

    # Only the HASHED password is ever stored - never the plain text.
    password = Column(String(255), nullable=False)

    # Enum column that can only hold one of: ADMIN, REVIEWER, USER.
    # default=Role.USER -> every new user starts with the USER role.
    role = Column(Enum(Role), default=Role.USER, nullable=False)

    # ------------------------------------------------------------------
    # ONE-TO-MANY relationship (User -> many Products)
    # ------------------------------------------------------------------
    # The "many" side is a Product, and each Product holds a
    # `owner_id` foreign key pointing back to this User's `id`.
    #
    # `relationship("Product", ...)` tells SQLAlchemy: when you load a
    # User, you may also need its list of Product objects. Here we give
    # it the name `products`, so `user.products` returns a Python list.
    #
    # `back_populates="owner"` connects this to the matching
    # `Product.owner` relationship. Keeping both sides linked means
    # SQLAlchemy automatically keeps them in sync (set one side and the
    # other is filled in automatically).
    #
    # `cascade="all, delete-orphan"` -> deleting a User also deletes all
    # of their Products (the relationship owns the deletion).
    products = relationship(
        "Product",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    # ------------------------------------------------------------------
    # ONE-TO-ONE relationship (User -> one Profile)
    # ------------------------------------------------------------------
    # A Profile row has a UNIQUE `user_id` foreign key, so at most one
    # Profile can belong to this User - that is what makes it one-to-one.
    #
    # `uselist=False` is the key: without it SQLAlchemy would treat the
    # relationship as a list (one-to-many). With it, `user.profile`
    # returns a single Profile object (or None).
    profile = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # ------------------------------------------------------------------
    # MANY-TO-MANY relationship (User <-> Product favorites)
    # ------------------------------------------------------------------
    # `secondary=user_favorites` tells SQLAlchemy: don't look for a
    # `favorite_products_id` column on either table - instead read the
    # join through the user_favorites association table.
    #
    # `back_populates="favorited_by"` mirrors Product.favorited_by so
    # both sides stay in sync automatically:
    #   user.favorite_products.append(product)  -> adds a row
    #   user.favorite_products.remove(product)  -> removes a row
    favorite_products = relationship(
        "Product",
        secondary=user_favorites,
        back_populates="favorited_by",
    )
