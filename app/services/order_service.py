from sqlalchemy.orm import Session

from app.core.exceptions import ResourceNotFoundError
from app.models.orders import Orders
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.order import OrderCreate


def create_order(data: OrderCreate, db: Session, current_user: User) -> dict:
    """
    Place a direct order for one product.

    This is the simple path (POST /orders). For the cart-based flow,
    see cart_service.checkout which calls OrderRepository.createOrder
    in a loop.
    """
    product = ProductRepository(db).get_by_id(data.product_id)
    if product is None:
        raise ResourceNotFoundError("Product not found")

    order = Orders(
        product=product.id,
        user=current_user.id,
        quantity=data.quantity,
    )
    return OrderRepository(db).createOrder(order)


def list_orders(db: Session, current_user: User) -> list[dict]:
    """
    Every order placed by the logged-in user, newest first.

    Each order is shaped for the API: the nested product details
    (name + price) come from the order_product relationship that
    SQLAlchemy loads automatically on access.
    """
    orders = OrderRepository(db).list_by_user(current_user.id)
    return [
        {
            "id": order.id,
            "quantity": order.quantity,
            "created_at": order.created_at,
            "product": {
                "id": order.order_product.id,
                "name": order.order_product.name,
                "price": order.order_product.price,
            },
        }
        for order in orders
    ]