

from sqlalchemy import Integer

from app.core.exceptions import ResourceNotFoundError
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.cart import CartCreate
from sqlalchemy.orm import Session

def addCart(data: CartCreate, 
            db: Session,
            user_id: Integer):
    product_item = ProductRepository(db).get_by_id(data.product_id)
    if product_item is None:
        raise ResourceNotFoundError("Product not found")
    cart = Cart(
        product = product_item.id,
        user = user_id,
        buyed = False
    )
    return CartRepository(db).createCart(cart)