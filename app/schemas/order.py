# ============================================================
# Order schemas.
#
# OrderCreate: sent by POST /orders to place a direct order.
#
# OrderProductSummary: nested inside OrderResponse so the UI can
#   display the purchased item's name and price.
#
# OrderResponse: what GET /orders returns (one per order).
#   Note: id is a UUID string, not an integer.
# ============================================================

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    """
    Payload for POST /orders.

    product_id must reference an existing Product. quantity defaults
    to 1 and must be at least 1.
    """

    product_id: int = Field(...)
    quantity: int = Field(default=1, ge=1)


class OrderProductSummary(BaseModel):
    """
    Compact product info nested inside an order response.

    Only id, name and price — deliberately excludes description,
    owner, and is_favorited to keep the payload minimal.
    """

    id: int
    name: str
    price: float


class OrderResponse(BaseModel):
    """
    How a single order is serialized for GET /orders.

    The nested `product` carries the purchased item's name and price.
    `from_attributes=True` lets Pydantic read directly from the
    SQLAlchemy Orders object.
    """

    # Allow Pydantic to build this model from a SQLAlchemy object.
    model_config = ConfigDict(from_attributes=True)

    id: str           # UUID string, not auto-increment integer
    quantity: int
    created_at: datetime
    product: OrderProductSummary