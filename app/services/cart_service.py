from sqlalchemy.orm import Session

from app.core.exceptions import ResourceNotFoundError
from app.models.cart import CartItem
from app.models.orders import Orders
from app.models.user import User
from app.repositories.cart_repository import CartRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.cart import CartItemCreate


def _serialize(item: CartItem) -> dict:
    """Shape a CartItem row for the API, pulling product details from the
    nested cart_product relationship (name + price)."""
    product = item.cart_product
    return {
        "id": item.id,
        "quantity": item.quantity,
        "created_at": item.created_at,
        "product": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
        },
    }


def add_to_cart(
    data: CartItemCreate,
    db: Session,
    current_user: User,
):
    product = ProductRepository(db).get_by_id(data.product_id)
    if product is None:
        raise ResourceNotFoundError("Product not found")
    if product.quantity < data.quantity or product.quantity == 0 :
        raise Exception("Out of quantity")
    repo = CartRepository(db)
    existing = repo.find_by_user_and_product(current_user.id, data.product_id)
    if existing is not None:
        # Already in the cart: bump the quantity instead of duplicating.
        existing.quantity += data.quantity
        product.quantity -= data.quantity
        db.commit() 
        db.refresh(existing)
        return _serialize(existing)

    item = CartItem(
        user_id=current_user.id,
        product_id=data.product_id,
        quantity=data.quantity,
    )

    return _serialize(repo.add(item, data))


def list_cart(db: Session, current_user: User):
    return [_serialize(item) for item in CartRepository(db).list_by_user(current_user.id)]


def update_quantity(
    item_id: int,
    quantity: int,
    db: Session,
    current_user: User,
):
    repo = CartRepository(db)
    item = repo.get_by_id(item_id)
    if item is None or item.user_id != current_user.id:
        raise ResourceNotFoundError("Cart item not found")

    # Adjust the product stock by the difference between new and old quantity.
    diff = quantity - item.quantity
    product_repo = ProductRepository(db)
    product = product_repo.get_by_id(item.product_id)
    if product is not None:
        if diff > 0 and product.quantity < diff:
            raise Exception("Not enough stock available")
        product.quantity -= diff
        db.commit()

    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return _serialize(item)


def remove_from_cart(item_id: int, db: Session, current_user: User) -> None:
    repo = CartRepository(db)
    item = repo.get_by_id(item_id)
    if item is None or item.user_id != current_user.id:
        raise ResourceNotFoundError("Cart item not found")

    # Restore the product stock that was reserved when the item was added.
    product_repo = ProductRepository(db)
    product = product_repo.get_by_id(item.product_id)
    if product is not None:
        product.quantity += item.quantity
        db.commit()

    repo.delete(item)


def checkout(db: Session, current_user: User):
    """
    Approve the cart: convert every cart line into an order row, then
    empty the cart. Returns the newly created orders.
    """
    cart_repo = CartRepository(db)
    order_repo = OrderRepository(db)
    items = cart_repo.list_by_user(current_user.id)

    created = []
    for item in items:
        # Skip lines whose product no longer exists (shouldn't happen
        # thanks to FK constraints, but guard anyway).
        if item.cart_product is None:
            continue
        order = Orders(
            product=item.product_id,
            user=current_user.id,
            quantity=item.quantity,
        )
        order_repo.createOrder(order)
        created.append(order)

    cart_repo.delete_all_for_user(current_user.id)
    return created
