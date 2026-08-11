from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    """
    Payload the CLIENT sends when creating a product.

    `Optional[str] = None` means the field may be omitted, and if omitted
    it is treated as None (NULL in the database).
    """
# ... required, 
# class User(BaseModel):
#   name: str = Field(alias='username')
# user = User(username='johndoe')  
# print(user)
    name: str = Field(...)
    description: Optional[str] = None 
    # or write str | none = none 
    price: float


class ProductUpdate(BaseModel):
    """
    Payload for updating a product. All fields optional so a client can
    send only the fields it wants to change (a PATCH-like behaviour even
    though the endpoint uses PUT).
    """

    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None


class OwnerSummary(BaseModel):
    """
    A small, safe summary of the User that owns a product.

    We deliberately return only `id` and `username` - NOT the email,
    password or role. This is the MANY-TO-ONE side of the relationship
    appearing in the API response.
    """

    id: int
    username: str

    # from_attributes tells Pydantic it may build this model straight
    # from a SQLAlchemy object (Product.owner) instead of a dict.
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    """
    How a product is serialized back to the client.

    Besides the product's own columns we include the nested `owner`
    object. Thanks to `selectinload(Product.owner)` in the repository,
    the owner is already loaded - no extra per-row query happens.
    """

    id: int
    name: str
    description: Optional[str] = None
    price: float
    owner_id: int
    owner: Optional[OwnerSummary] = None
    # usually the pydantic reads or wants the dict by this it will get the object 
    model_config = ConfigDict(from_attributes=True)


class PaginatedProducts(BaseModel):
    """
    Wrapper returned by the paginated GET /products.

    `items` holds only the current page of products while `total`/`pages`
    tell the client how many results exist so it can render page controls.
    """

    items: list[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int
