from sqlalchemy.orm import Session

from app.models.orders import Orders


class OrderRepository:
    """
    All database queries related to Orders live here.

    Orders use a UUID string as their primary key (see app/models/orders.py)
    so order IDs are not guessable. The model is named `Orders` (plural)
    because `order` is a reserved SQL keyword.
    """

    def __init__(self, db: Session):
        # Keep a reference to the database session for every method.
        self.db = db

    def createOrder(self, data: Orders):
        """
        Insert a new order row and commit immediately.

        Called by both:
          - order_service.create_order (direct purchase)
          - cart_service.checkout    (bulk cart-to-order conversion)
        """
        self.db.add(data)
        self.db.commit()
        self.db.refresh(data)
        return data

    def list_by_user(self, user_id: int) -> list[Orders]:
        """
        All orders placed by one user, newest first.

        The service layer serializes each order, pulling product name
        and price from the nested order_product relationship.
        """
        return (
            self.db.query(Orders)
            .filter(Orders.user == user_id)
            .order_by(Orders.created_at.desc())
            .all()
        )