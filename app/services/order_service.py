


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


def list_orders(db: Session, current_user: User):
    orders = OrderRepository(db).list_by_user(current_user.id)
    # Shape each order for the API: the product details come from the
    # nested order_product relationship (product name + price).
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