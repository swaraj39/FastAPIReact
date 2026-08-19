from enum import Enum


class Role(str, Enum):
    """
    User role enumeration.

    Used by:
      - User model (app/models/user.py)   -> column type
      - Auth dependency (app/api/dependencies.py) -> require_role()
      - JWT payload (app/core/security.py) -> role claim

    Hierarchy: ADMIN > REVIEWER > USER
    """

    ADMIN = "ADMIN"       # Full access: manage users, products, all endpoints
    REVIEWER = "REVIEWER" # Reserved for future use (e.g. content review)
    USER = "USER"         # Default role: own products, cart, orders
