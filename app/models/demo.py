from sqlalchemy import Column, Integer, String

from app.db.base import Base


class Demo(Base):
    """
    A simple demo model kept for reference.

    Demonstrates the minimal SQLAlchemy model pattern:
      - inherits from Base (declared in app/db/base.py)
      - declares __tablename__ (the actual table name)
      - defines columns with constraints

    This model is NOT imported in main.py and therefore does NOT
    create a table. It exists purely as a learning reference.
    """

    __tablename__ = "demo"

    # Primary key with an index for fast lookups.
    id = Column(Integer, primary_key=True, index=True)

    # A non-nullable string column (no length limit since SQLite
    # ignores it; PostgreSQL / MySQL would enforce the default 255).
    name = Column(String, nullable=False)