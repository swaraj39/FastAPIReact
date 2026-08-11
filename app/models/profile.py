from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Profile(Base):
    """
    A Profile stores extra details about a User.

    This is the ONE side of the User ONE-TO-ONE relationship.

    The uniqueness of `user_id` (unique=True below) is what enforces
    one-to-one: only ONE Profile row can point at a given User.
    """

    __tablename__ = "profiles"

    # Primary key for this profile row.
    id = Column(Integer, primary_key=True, index=True)

    # ------------------------------------------------------------------
    # FOREIGN KEY that points back to the owning User.
    # ------------------------------------------------------------------
    # `unique=True` is what turns this into a one-to-one relationship -
    # the database refuses to store a second Profile with the same user_id.
    #
    # `ondelete="CASCADE"` is a DATABASE-level rule: if the User row is
    # deleted directly in SQL, the matching Profile is deleted too.
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Profile columns that store the user's personal information.
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    date_of_birth = Column(Date, nullable=True)

    # ------------------------------------------------------------------
    # ONE-TO-ONE relationship (Profile -> its User)
    # ------------------------------------------------------------------
    # `back_populates="profile"` mirrors `User.profile` from user.py.
    # No `uselist` flag is needed here: a single FK always resolves to a
    # single parent object, so SQLAlchemy defaults to "one" automatically.
    user = relationship("User", back_populates="profile")
