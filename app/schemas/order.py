from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(default=1, ge=1)


class OrderProductSummary(BaseModel):
    id: int
    name: str
    price: float


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quantity: int
    created_at: datetime
    product: OrderProductSummary