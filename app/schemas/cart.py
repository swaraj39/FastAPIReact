# ============================================================
# Cart schemas.
#
# CartItemCreate: sent by the frontend to add an item to the cart.
#   product_id identifies the product; quantity defaults to 1.
#
# CartItemUpdate: sent to change the quantity of an existing cart line.
#
# CartProductSummary: nested inside CartItemResponse so the UI can
#   display the product name and price without extra requests.
#
# CartItemResponse: what GET /cart returns (one per cart line).
# ============================================================

from datetime import datetime

from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    """
    Payload for POST /cart.

    product_id must reference an existing Product. quantity is optional
    (defaults to 1) and must be at least 1.
    """

    product_id: int = Field(...)
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    """
    Payload for PUT /cart/{item_id}.

    Only the quantity is updatable; product_id is immutable once added.
    """

    quantity: int = Field(..., ge=1)


class CartProductSummary(BaseModel):
    """
    Compact product info nested inside a cart response.

    Only id, name and price are included — deliberately no description,
    owner, or other fields to keep the payload small.
    """

    id: int
    name: str
    price: float


class CartItemResponse(BaseModel):
    """
    How a single cart line is serialized for GET /cart.

    The nested `product` carries the name and price so the frontend
    can display the cart without loading products separately.
    """

    id: int
    quantity: int
    created_at: datetime
    product: CartProductSummary