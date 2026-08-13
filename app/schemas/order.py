from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(default=1, ge=1)