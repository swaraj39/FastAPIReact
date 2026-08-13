


from sqlalchemy.orm import Session

from app.core.exceptions import ResourceNotFoundError
from app.models.orders import Orders
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.order import OrderCreate


def create_order(data: OrderCreate,
                db : Session,
                current_user: User):
    product = ProductRepository(db).get_by_id(data.product_id)
    if product is None:
        raise ResourceNotFoundError("Product not found")
    orders = Orders(
        product=product.id,
        user=current_user.id,
        quantity=data.quantity
    )
    return OrderRepository(db).createOrder(orders)