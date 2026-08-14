from sqlalchemy.orm import Session

from app.models.cart import CartItem


class CartRepository:

    def __init__(self, db: Session):
        self.db = db

    def add(self, item: CartItem) -> CartItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def find_by_user_and_product(self, user_id: int, product_id: int) -> CartItem | None:
        return (
            self.db.query(CartItem)
            .filter(
                CartItem.user_id == user_id,
                CartItem.product_id == product_id,
            )
            .first()
        )

    def get_by_id(self, item_id: int) -> CartItem | None:
        return self.db.query(CartItem).filter(CartItem.id == item_id).first()

    def list_by_user(self, user_id: int) -> list[CartItem]:
        return (
            self.db.query(CartItem)
            .filter(CartItem.user_id == user_id)
            .order_by(CartItem.created_at.desc())
            .all()
        )

    def delete(self, item: CartItem) -> None:
        self.db.delete(item)
        self.db.commit()

    def delete_all_for_user(self, user_id: int) -> None:
        self.db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        self.db.commit()
