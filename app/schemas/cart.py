


from pydantic import BaseModel, Field


class CartCreate(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(default=1, ge=1)
