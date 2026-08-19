from sqlalchemy.orm import Session

from app.models.cart import CartItem


class CartRepository:
    """
    All database queries related to CartItem live here.

    The cart is the PENDING state: items are added here first, and only
    after checkout (cart_service.checkout) are they converted into
    permanent order rows.
    """

    def __init__(self, db: Session):
        # Keep a reference to the database session for every method.
        self.db = db

    def add(self, item: CartItem) -> CartItem:
        """Insert a new cart line and commit immediately."""
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def find_by_user_and_product(self, user_id: int, product_id: int) -> CartItem | None:
        """
        Check if a specific product is already in the user's cart.

        Used by cart_service.add_to_cart to decide whether to bump
        the quantity (product already in cart) or insert a new row.
        """
        return (
            self.db.query(CartItem)
            .filter(
                CartItem.user_id == user_id,
                CartItem.product_id == product_id,
            )
            .first()
        )

    def get_by_id(self, item_id: int) -> CartItem | None:
        """Fetch a single cart line by its primary key."""
        return self.db.query(CartItem).filter(CartItem.id == item_id).first()

    def list_by_user(self, user_id: int) -> list[CartItem]:
        """
        Every cart line for one user, newest first.

        The service layer serializes each item via _serialize() so the
        response includes nested product details (name, price).
        """
        return (
            self.db.query(CartItem)
            .filter(CartItem.user_id == user_id)
            .order_by(CartItem.created_at.desc())
            .all()
        )

    def delete(self, item: CartItem) -> None:
        """Remove a single cart line and commit."""
        self.db.delete(item)
        self.db.commit()

    def delete_all_for_user(self, user_id: int) -> None:
        """
        Empty the entire cart for one user (used after checkout).

        This is a bulk delete — more efficient than loading each row
        individually when clearing many lines at once.
        """
        self.db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        self.db.commit()
