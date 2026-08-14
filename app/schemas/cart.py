from datetime import datetime

from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartProductSummary(BaseModel):
    id: int
    name: str
    price: float


class CartItemResponse(BaseModel):
    id: int
    quantity: int
    created_at: datetime
    product: CartProductSummary