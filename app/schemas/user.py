from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.role import Role


class ProfileCreate(BaseModel):
    """
    Payload for the profile part of registration.
    The frontend sends all User + Profile fields in one body and the
    backend SPLITS them: User fields go to the users table, these
    Profile fields go to the profiles table.
    """

    full_name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[date] = None


class UserCreate(BaseModel):
    """
    Full registration body: User columns + a nested `profile` object.

    Pydantic will validate the nested object against ProfileCreate and
    expose it as `data.profile` in the service layer.
    """

    username: str
    email: EmailStr  # EmailStr enforces a valid email format.
    password: str
    profile: ProfileCreate


class ProfileResponse(BaseModel):
    """
    How a Profile is serialized in responses (one-to-one side).

    `from_attributes=True` lets Pydantic read the fields directly from
    the SQLAlchemy Profile object.
    """

    id: int
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    """
    Standard User object sent to clients. Note it includes the nested
    `profile` (one-to-one) but NOT the password.
    """

    id: int
    username: str
    email: EmailStr
    role: Role
    profile: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductSummary(BaseModel):
    """
    A compact Product used INSIDE a User object. It deliberately does
    NOT include the nested `owner` to avoid a circular response
    (User -> Product -> owner -> User -> ...).
    """

    id: int
    name: str
    description: Optional[str] = None
    price: float
    owner_id: int

    model_config = ConfigDict(from_attributes=True)


class UserWithProductsResponse(BaseModel):
    """
    Demonstrates the ONE-TO-MANY direction in the API: a User comes back
    with a `products` list attached.

    The list is populated because the repository eager-loads it with
    `selectinload(User.products)` - see user_repository.get_with_details.
    """

    id: int
    username: str
    email: EmailStr
    role: Role
    profile: Optional[ProfileResponse] = None
    products: list[ProductSummary] = []

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """
    Profile/account update body. Flattened (not nested) so the client can
    change a User field or a Profile field with one request.
    """

    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[date] = None


class Forgot(BaseModel):
    """
    Payload for the forgot-password flow. The user identifies themselves
    with their username and supplies a new password.
    """

    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if not v or len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v